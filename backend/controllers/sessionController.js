'use strict';
const db         = require('../config/db');
const { ok, fail } = require('../utils/responseUtils');
const { logger }   = require('../config/logger');

async function incrementTokenVersion(userId, tenantId) {
  const [result] = await db.execute('UPDATE users SET token_version = token_version + 1 WHERE id = ? AND tenant_id = ?', [userId, tenantId]);
  if (result.affectedRows === 0) throw Object.assign(new Error('User not found'), { status: 404 });
  const [[user]] = await db.execute('SELECT token_version FROM users WHERE id = ? AND tenant_id = ? LIMIT 1', [userId, tenantId]);
  return user.token_version;
}

exports.logoutAll = async (req, res, next) => {
  try {
    const newVersion = await incrementTokenVersion(req.user.userId, req.tenant.id);
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    logger.info('User logged out all sessions', { userId: req.user.userId, tenantId: req.tenant.id, newTokenVersion: newVersion });
    ok(res, {}, 'Logged out from all devices');
  } catch (err) { next(err); }
};

exports.revokeUserSessions = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.body.userId);
    const tenantId     = req.tenant.id;
    const [[targetUser]] = await db.execute('SELECT id, name, email FROM users WHERE id = ? AND tenant_id = ? LIMIT 1', [targetUserId, tenantId]);
    if (!targetUser) return fail(res, 'User not found in your tenant', 404);
    await incrementTokenVersion(targetUserId, tenantId);
    logger.info('Admin revoked user sessions', { adminUserId: req.user.userId, targetUserId, tenantId });
    ok(res, { userId: targetUserId, userName: targetUser.name }, `Sessions revoked for ${targetUser.name}`);
  } catch (err) { next(err); }
};

exports.sessionInfo = async (req, res, next) => {
  try {
    const [[user]] = await db.execute('SELECT id, name, email, role, token_version FROM users WHERE id = ? AND tenant_id = ? LIMIT 1', [req.user.userId, req.tenant.id]);
    if (!user) return fail(res, 'User not found', 404);
    const jwt     = require('jsonwebtoken');
    const token   = req.cookies?.token || req.headers.authorization?.slice(7);
    const decoded = token ? jwt.decode(token) : {};
    ok(res, { session: { userId: user.id, name: user.name, email: user.email, role: user.role, issuedAt: decoded?.iat ? new Date(decoded.iat * 1000).toISOString() : null, expiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null, isCurrent: (decoded?.tokenVersion ?? 0) === user.token_version } });
  } catch (err) { next(err); }
};
