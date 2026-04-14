'use strict';
const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES  = 12;
const TAG_BYTES = 16;

let _key = null;
function getKey() {
  if (!_key) {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex))
      throw new Error('[encryption] ENCRYPTION_KEY must be 64 hex characters');
    _key = Buffer.from(hex, 'hex');
  }
  return _key;
}

function encrypt(plaintext) {
  if (typeof plaintext !== 'string' || !plaintext.length) throw new Error('[encryption] encrypt() requires non-empty string');
  const key    = getKey();
  const iv     = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), enc.toString('hex')].join(':');
}

function decrypt(stored) {
  if (typeof stored !== 'string' || !stored.length) throw new Error('[encryption] decrypt() requires non-empty string');
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('[encryption] Malformed ciphertext');
  const [ivHex, tagHex, ctHex] = parts;
  const key      = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'), { authTagLength: TAG_BYTES });
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]).toString('utf8');
}

function isEncrypted(value) {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  return /^[0-9a-f]{24}$/.test(parts[0]);
}

function safeDecrypt(value) { if (!value) return value; return isEncrypted(value) ? decrypt(value) : value; }

module.exports = { encrypt, decrypt, isEncrypted, safeDecrypt };
