'use strict';
const path   = require('path');
const fs     = require('fs');
const db     = require('../config/db');
const { ok, fail } = require('../utils/responseUtils');
const { logger }   = require('../config/logger');

exports.productImage = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);
    const tenantId    = req.tenant.id;
    const relativePath = path.join(String(tenantId), 'products', req.file.filename).replace(/\\/g, '/');
    const publicUrl    = `/uploads/${relativePath}`;
    if (req.body.product_id) {
      const productId = parseInt(req.body.product_id);
      const [rows] = await db.execute('SELECT image_url FROM products WHERE id = ? AND tenant_id = ? LIMIT 1', [productId, tenantId]);
      if (rows.length && rows[0].image_url) _deleteOldFile(rows[0].image_url);
      await db.execute('UPDATE products SET image_url = ? WHERE id = ? AND tenant_id = ?', [publicUrl, productId, tenantId]);
    }
    ok(res, { url: publicUrl, filename: req.file.filename, size: req.file.size, mimetype: req.file.detectedMime || req.file.mimetype }, 'Image uploaded', 201);
  } catch (err) { next(err); }
};

exports.logo = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);
    const tenantId    = req.tenant.id;
    const relativePath = path.join(String(tenantId), 'logo', req.file.filename).replace(/\\/g, '/');
    const publicUrl    = `/uploads/${relativePath}`;
    const [rows] = await db.execute('SELECT logo_url FROM tenants WHERE id = ? LIMIT 1', [tenantId]);
    if (rows.length && rows[0].logo_url) _deleteOldFile(rows[0].logo_url);
    await db.execute('UPDATE tenants SET logo_url = ? WHERE id = ?', [publicUrl, tenantId]);
    ok(res, { url: publicUrl }, 'Logo uploaded', 201);
  } catch (err) { next(err); }
};

function _deleteOldFile(publicUrl) {
  const rel = publicUrl.replace(/^\/uploads\//, '');
  const abs = path.join(__dirname, '../../uploads', rel);
  fs.unlink(abs, (err) => { if (err && err.code !== 'ENOENT') logger.warn('Could not delete old file', { path: abs, error: err.message }); });
}
