'use strict';
const jwt    = require('jsonwebtoken');
const dns    = require('dns').promises;
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const db     = require('../config/db');
const { hash }          = require('../utils/hashUtils');
const { ok, fail }      = require('../utils/responseUtils');
const { logger }        = require('../config/logger');
const { encrypt, isEncrypted } = require('../utils/encryption');
const { tenantCache }   = require('../config/cache');
const tenantMiddleware  = require('../middleware/tenantMiddleware');

function timingSafeStringEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const maxLen = Math.max(Buffer.byteLength(a), Buffer.byteLength(b));
  const bufA = Buffer.alloc(maxLen); const bufB = Buffer.alloc(maxLen);
  bufA.write(a); bufB.write(b);
  return crypto.timingSafeEqual(bufA, bufB) && a.length === b.length;
}

exports.login = (req, res) => {
  if (!process.env.SUPERADMIN_SECRET) return fail(res, 'Superadmin not configured', 503);
  if (process.env.SUPERADMIN_SECRET.length < 32) { logger.error('SUPERADMIN_SECRET too short'); return fail(res, 'Superadmin misconfigured', 503); }
  const match = timingSafeStringEqual(process.env.SUPERADMIN_SECRET, req.body.secret);
  if (!match) { logger.warn('Superadmin login failed', { ip: req.ip }); return setTimeout(() => fail(res, 'Invalid secret', 401), 5); }
  const token = jwt.sign({ role: 'superadmin', issuedAt: Date.now() }, process.env.SUPERADMIN_JWT_SECRET, { expiresIn: '8h', issuer: 'bakery-platform-superadmin' });
  res.cookie('superadmin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000, path: '/api/superadmin' });
  logger.info('Superadmin login successful', { ip: req.ip });
  ok(res, { token });
};

exports.logout = (req, res) => { res.clearCookie('superadmin_token'); ok(res, {}, 'Logged out'); };

exports.listTenants = async (req, res, next) => {
  try {
    const [tenants] = await db.execute(`SELECT t.id, t.name, t.domain, t.logo_url, t.theme_color, t.whatsapp_number, t.is_active, t.created_at, (t.razorpay_key_id IS NOT NULL AND t.razorpay_key_id != '') AS has_razorpay, COUNT(DISTINCT p.id) AS product_count, COUNT(DISTINCT o.id) AS order_count FROM tenants t LEFT JOIN products p ON p.tenant_id = t.id AND p.is_active = 1 LEFT JOIN orders o ON o.tenant_id = t.id GROUP BY t.id ORDER BY t.created_at DESC`);
    ok(res, { tenants });
  } catch (err) { next(err); }
};

exports.getTenant = async (req, res, next) => {
  try {
    const [[tenant]] = await db.execute('SELECT id, name, domain, logo_url, theme_color, whatsapp_number, razorpay_key_id, is_active, created_at FROM tenants WHERE id = ? LIMIT 1', [req.params.id]);
    if (!tenant) return fail(res, 'Tenant not found', 404);
    if (tenant.razorpay_key_id) { tenant.razorpay_key_id_display = tenant.razorpay_key_id.slice(0, 12) + '••••'; delete tenant.razorpay_key_id; }
    ok(res, { tenant });
  } catch (err) { next(err); }
};

exports.createTenant = async (req, res, next) => {
  try {
    const { name, domain, theme_color = '#D97706', whatsapp_number, razorpay_key_id, razorpay_key_secret } = req.body;
    const normDomain = domain.toLowerCase().replace(/^www\./, '');
    const [[existing]] = await db.execute('SELECT id FROM tenants WHERE domain = ? LIMIT 1', [normDomain]);
    if (existing) return fail(res, `Domain "${normDomain}" already registered`, 409);
    let encryptedSecret = null;
    if (razorpay_key_secret) { try { encryptedSecret = encrypt(razorpay_key_secret); } catch { return fail(res, 'Failed to secure payment credentials', 500); } }
    const [result] = await db.execute('INSERT INTO tenants (name, domain, theme_color, whatsapp_number, razorpay_key_id, razorpay_key_secret, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', [name, normDomain, theme_color, whatsapp_number || null, razorpay_key_id || null, encryptedSecret]);
    const tenantId = result.insertId;
    _createTenantDirectories(tenantId);
    logger.info('New tenant created', { tenantId, domain: normDomain });
    ok(res, { tenantId, domain: normDomain }, 'Tenant created', 201);
  } catch (err) { next(err); }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    const allowed  = ['name','domain','logo_url','theme_color','whatsapp_number','razorpay_key_id','razorpay_key_secret','is_active'];
    const fields = [], values = [];
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      let val = req.body[key];
      if (key === 'domain') val = val.toLowerCase().replace(/^www\./, '');
      if (key === 'razorpay_key_secret' && val) { try { val = isEncrypted(val) ? val : encrypt(val); } catch { return fail(res, 'Failed to secure credentials', 500); } }
      fields.push(`${key} = ?`); values.push(val);
    }
    if (!fields.length) return fail(res, 'No valid fields to update');
    if (req.body.domain) {
      const newDomain = req.body.domain.toLowerCase().replace(/^www\./, '');
      const [[conflict]] = await db.execute('SELECT id FROM tenants WHERE domain = ? AND id != ? LIMIT 1', [newDomain, tenantId]);
      if (conflict) return fail(res, `Domain "${newDomain}" already registered`, 409);
    }
    values.push(tenantId);
    const [result] = await db.execute(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`, values);
    if (!result.affectedRows) return fail(res, 'Tenant not found', 404);
    if (req.body.domain) { const d = req.body.domain.toLowerCase().replace(/^www\./, ''); tenantMiddleware.invalidate(d); tenantCache.delete(`domain:${d}`); }
    logger.info('Tenant updated', { tenantId });
    ok(res, {}, 'Tenant updated');
  } catch (err) { next(err); }
};

exports.deactivateTenant = async (req, res, next) => {
  try {
    const [result] = await db.execute('UPDATE tenants SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return fail(res, 'Tenant not found', 404);
    logger.info('Tenant deactivated', { tenantId: req.params.id });
    ok(res, {}, 'Tenant deactivated');
  } catch (err) { next(err); }
};

exports.getChecklist = async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    const [[tenant]] = await db.execute('SELECT id, name, domain, whatsapp_number, razorpay_key_id, logo_url FROM tenants WHERE id = ? LIMIT 1', [tenantId]);
    if (!tenant) return fail(res, 'Tenant not found', 404);
    const uploadsDir   = path.resolve(__dirname, '../../uploads', String(tenantId));
    const uploadsExist = fs.existsSync(uploadsDir);
    const [[adminCheck]] = await db.execute("SELECT COUNT(*) AS count FROM users WHERE tenant_id = ? AND role = 'admin' AND is_active = 1", [tenantId]);
    let dnsStatus = 'unknown', dnsAddress = null;
    try { const addresses = await dns.resolve4(tenant.domain); dnsAddress = addresses[0] || null; dnsStatus = addresses.length > 0 ? 'resolved' : 'not_resolved'; } catch { dnsStatus = 'not_resolved'; }
    const checklist = [
      { id: 'uploads_dir', label: 'Upload directory created', done: uploadsExist,         action: uploadsExist ? null : `mkdir -p uploads/${tenantId}/products uploads/${tenantId}/logo` },
      { id: 'admin_user',  label: 'Admin user created',       done: adminCheck.count > 0, action: adminCheck.count > 0 ? null : `POST /api/superadmin/tenants/${tenantId}/seed-admin` },
      { id: 'razorpay',    label: 'Razorpay keys configured', done: !!tenant.razorpay_key_id, action: tenant.razorpay_key_id ? null : `PUT /api/superadmin/tenants/${tenantId}` },
      { id: 'whatsapp',    label: 'WhatsApp number set',      done: !!tenant.whatsapp_number, action: tenant.whatsapp_number ? null : `PUT /api/superadmin/tenants/${tenantId}` },
      { id: 'logo',        label: 'Logo uploaded',            done: !!tenant.logo_url,    action: tenant.logo_url ? null : 'POST /api/upload/logo' },
      { id: 'dns',         label: `DNS resolves for ${tenant.domain}`, done: dnsStatus === 'resolved', note: dnsStatus === 'resolved' ? `Resolves to ${dnsAddress}` : 'Add A record pointing to server IP', action: null },
    ];
    const doneCount = checklist.filter(c => c.done).length;
    ok(res, { tenant: { id: tenant.id, name: tenant.name, domain: tenant.domain }, checklist, summary: { total: checklist.length, done: doneCount, allDone: doneCount === checklist.length } });
  } catch (err) { next(err); }
};

exports.seedAdminUser = async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    const { name, email, password } = req.body;
    const [[tenant]] = await db.execute('SELECT id FROM tenants WHERE id = ? AND is_active = 1 LIMIT 1', [tenantId]);
    if (!tenant) return fail(res, 'Tenant not found', 404);
    const [[existing]] = await db.execute('SELECT id FROM users WHERE tenant_id = ? AND email = ? LIMIT 1', [tenantId, email]);
    if (existing) return fail(res, 'Email already registered for this tenant', 409);
    const hashed = await hash(password);
    const [result] = await db.execute("INSERT INTO users (tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, 'admin')", [tenantId, name, email, hashed]);
    logger.info('Admin seeded for tenant', { tenantId, email, userId: result.insertId });
    ok(res, { userId: result.insertId }, 'Admin user created', 201);
  } catch (err) { next(err); }
};

function _createTenantDirectories(tenantId) {
  const base = path.resolve(__dirname, '../../uploads', String(tenantId));
  ['products', 'logo'].forEach(subdir => {
    try { fs.mkdirSync(path.join(base, subdir), { recursive: true, mode: 0o755 }); }
    catch (err) { logger.warn('Could not create upload dir', { tenantId, subdir, error: err.message }); }
  });
}
