'use strict';
const jwt = require('jsonwebtoken');
const db  = require('../config/db');
const { logger } = require('../config/logger');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'bakery-platform' });
    if (decoded.tenantId !== req.tenant.id) {
      logger.warn('Token tenant mismatch', { tokenTenant: decoded.tenantId, requestTenant: req.tenant.id, ip: req.ip });
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const [[dbUser]] = await db.execute(
      'SELECT token_version, is_active FROM users WHERE id = ? AND tenant_id = ? LIMIT 1',
      [decoded.userId, req.tenant.id]
    );
    if (!dbUser || !dbUser.is_active) return res.status(401).json({ success: false, message: 'Account not found or deactivated' });
    const tokenVersion = decoded.tokenVersion ?? 0;
    if (tokenVersion !== dbUser.token_version) {
      logger.info('Revoked token rejected', { userId: decoded.userId, tenantId: req.tenant.id, tokenVersion, dbVersion: dbUser.token_version });
      return res.status(401).json({ success: false, message: 'Session has been revoked. Please log in again.', code: 'TOKEN_REVOKED' });
    }
    req.user = { userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role, tokenVersion };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token' });
    next(err);
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
}

module.exports = { authMiddleware, adminOnly };
