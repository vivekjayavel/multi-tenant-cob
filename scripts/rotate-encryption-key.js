#!/usr/bin/env node
'use strict';
require('dotenv').config();
const crypto = require('crypto');
const db     = require('../backend/config/db');
const ALGO = 'aes-256-gcm';

function makeEncryptor(keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  return {
    encrypt(plain) { const iv = crypto.randomBytes(12), c = crypto.createCipheriv(ALGO, key, iv, { authTagLength: 16 }); const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]); return [iv.toString('hex'), c.getAuthTag().toString('hex'), enc.toString('hex')].join(':'); },
    decrypt(stored) { const [ivH, tagH, ctH] = stored.split(':'); const d = crypto.createDecipheriv(ALGO, key, Buffer.from(ivH, 'hex'), { authTagLength: 16 }); d.setAuthTag(Buffer.from(tagH, 'hex')); return Buffer.concat([d.update(Buffer.from(ctH, 'hex')), d.final()]).toString('utf8'); },
  };
}

(async () => {
  const oldKey = process.env.OLD_ENCRYPTION_KEY, newKey = process.env.NEW_ENCRYPTION_KEY;
  if (!oldKey || !/^[0-9a-fA-F]{64}$/.test(oldKey)) { console.error('OLD_ENCRYPTION_KEY must be 64 hex chars'); process.exit(1); }
  if (!newKey || !/^[0-9a-fA-F]{64}$/.test(newKey)) { console.error('NEW_ENCRYPTION_KEY must be 64 hex chars'); process.exit(1); }
  if (oldKey === newKey) { console.error('Keys must be different'); process.exit(1); }
  const oldC = makeEncryptor(oldKey), newC = makeEncryptor(newKey);
  const [tenants] = await db.execute("SELECT id, name, razorpay_key_secret FROM tenants WHERE razorpay_key_secret IS NOT NULL AND razorpay_key_secret != ''");
  console.log(`\n🔑 Rotating key for ${tenants.length} tenant(s)...\n`);
  let rotated = 0, failed = 0;
  for (const t of tenants) {
    try {
      const plain = oldC.decrypt(t.razorpay_key_secret);
      const enc   = newC.encrypt(plain);
      if (newC.decrypt(enc) !== plain) throw new Error('Round-trip failed');
      await db.execute('UPDATE tenants SET razorpay_key_secret = ? WHERE id = ?', [enc, t.id]);
      console.log(`  ✅ Tenant ${t.id} (${t.name}): rotated`); rotated++;
    } catch (err) { console.error(`  ❌ Tenant ${t.id}: ${err.message}`); failed++; }
  }
  console.log(`\nRotated: ${rotated}, Failed: ${failed}`);
  if (failed > 0) { console.error('⚠️  DO NOT update ENCRYPTION_KEY until failures are fixed.'); process.exit(1); }
  console.log('✅ Update ENCRYPTION_KEY in .env, then restart.');
  process.exit(0);
})().catch(err => { console.error(err.message); process.exit(1); });
