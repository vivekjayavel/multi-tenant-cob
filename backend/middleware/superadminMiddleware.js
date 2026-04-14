'use strict';
const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');

function superadminMiddleware(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    const host = (req.headers.host || '').split(':')[0].toLowerCase();
    if (process.env.SUPERADMIN_DOMAIN && host !== process.env.SUPERADMIN_DOMAIN.toLowerCase()) {
      logger.warn('Superadmin access from wrong domain', { host, expected: process.env.SUPERADMIN_DOMAIN, ip: req.ip });
      return res.status(404).json({ success: false, message: 'Not found' });
    }
  }
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.superadmin_token;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, process.env.SUPERADMIN_JWT_SECRET, { issuer: 'bakery-platform-superadmin' });
    if (decoded.role !== 'superadmin') {
      logger.warn('Non-superadmin token on superadmin endpoint', { role: decoded.role, ip: req.ip });
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    req.superadmin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Session expired' });
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
module.exports = superadminMiddleware;
