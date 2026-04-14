'use strict';
const crypto = require('crypto');
let _internalKey = null;
function getInternalKey() {
  if (!_internalKey) {
    const source = process.env.SUPERADMIN_JWT_SECRET;
    if (!source || source.length < 16) throw new Error('[safeCompare] SUPERADMIN_JWT_SECRET must be at least 16 characters');
    _internalKey = crypto.createHmac('sha256', source).update('safeCompare-internal-v1').digest();
  }
  return _internalKey;
}
function timingSafeStringEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const key   = getInternalKey();
  const hmacA = crypto.createHmac('sha256', key).update(a, 'utf8').digest();
  const hmacB = crypto.createHmac('sha256', key).update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hmacA, hmacB);
}
module.exports = { timingSafeStringEqual };
