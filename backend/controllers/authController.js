'use strict';
const db                   = require('../config/db');
const { hash, compare }    = require('../utils/hashUtils');
const { sign }             = require('../utils/jwtUtils');
const { ok, fail }         = require('../utils/responseUtils');
const IS_PROD = process.env.NODE_ENV === 'production';

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const tenantId = req.tenant.id;
    const [existing] = await db.execute('SELECT id FROM users WHERE tenant_id = ? AND email = ? LIMIT 1', [tenantId, email]);
    if (existing.length) return fail(res, 'Email already registered', 409);
    const hashed = await hash(password);
    const [result] = await db.execute('INSERT INTO users (tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [tenantId, name, email, hashed, 'customer']);
    const token = sign({ userId: result.insertId, tenantId, role: 'customer' }, 0);
    _setTokenCookie(res, token);
    ok(res, { token, user: { id: result.insertId, name, email, role: 'customer' } }, 'Registration successful', 201);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.tenant.id;
    const [rows] = await db.execute('SELECT id, name, email, password, role, token_version FROM users WHERE tenant_id = ? AND email = ? AND is_active = 1 LIMIT 1', [tenantId, email]);
    if (!rows.length) return fail(res, 'Invalid credentials', 401);
    const user  = rows[0];
    const valid = await compare(password, user.password);
    if (!valid) return fail(res, 'Invalid credentials', 401);
    const token = sign({ userId: user.id, tenantId, role: user.role }, user.token_version);
    _setTokenCookie(res, token);
    delete user.password; delete user.token_version;
    ok(res, { token, user });
  } catch (err) { next(err); }
};

exports.logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: IS_PROD, sameSite: 'lax' });
  ok(res, {}, 'Logged out');
};

exports.me = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ? AND tenant_id = ? LIMIT 1', [req.user.userId, req.tenant.id]);
    if (!rows.length) return fail(res, 'User not found', 404);
    ok(res, { user: rows[0] });
  } catch (err) { next(err); }
};

function _setTokenCookie(res, token) {
  res.cookie('token', token, { httpOnly: true, secure: IS_PROD, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
}
