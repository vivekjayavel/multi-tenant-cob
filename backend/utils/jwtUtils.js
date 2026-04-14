'use strict';
const jwt = require('jsonwebtoken');
function sign(payload, tokenVersion = 0) {
  if (!payload.userId || !payload.tenantId || !payload.role)
    throw new Error('[jwtUtils] sign() requires userId, tenantId, and role');
  return jwt.sign({ ...payload, tokenVersion }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', issuer: 'bakery-platform' });
}
function verify(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { issuer: 'bakery-platform' });
}
module.exports = { sign, verify };
