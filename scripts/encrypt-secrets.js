#!/usr/bin/env node
'use strict';
require('dotenv').config();
const db = require('../backend/config/db');
const { encrypt, decrypt, isEncrypted } = require('../backend/utils/encryption');
const isDryRun = process.argv.includes('--dry-run');
const isVerify = process.argv.includes('--verify');

(async () => {
  console.log('\n🔐 Razorpay Secret Encryption\n' + '─'.repeat(40));
  if (isDryRun) console.log('⚠️  DRY RUN\n');
  const [tenants] = await db.execute("SELECT id, name, domain, razorpay_key_secret FROM tenants WHERE razorpay_key_secret IS NOT NULL AND razorpay_key_secret != ''");
  if (!tenants.length) { console.log('✅ No secrets found.'); process.exit(0); }
  console.log(`Found ${tenants.length} tenant(s).\n`);
  let encrypted = 0, skipped = 0, failed = 0;
  for (const t of tenants) {
    if (isEncrypted(t.razorpay_key_secret)) { console.log(`  ⏭️  Tenant ${t.id} (${t.name}): already encrypted`); skipped++; continue; }
    if (isVerify) { console.log(`  ⚠️  Tenant ${t.id} (${t.name}): NOT ENCRYPTED`); failed++; continue; }
    if (isDryRun) { console.log(`  🔍 Tenant ${t.id} (${t.name}): would encrypt`); encrypted++; continue; }
    try {
      const enc = encrypt(t.razorpay_key_secret);
      const roundTrip = decrypt(enc);
      if (roundTrip !== t.razorpay_key_secret) throw new Error('Round-trip failed');
      await db.execute('UPDATE tenants SET razorpay_key_secret = ? WHERE id = ?', [enc, t.id]);
      console.log(`  ✅ Tenant ${t.id} (${t.name}): encrypted`); encrypted++;
    } catch (err) { console.error(`  ❌ Tenant ${t.id}: ${err.message}`); failed++; }
  }
  console.log(`\n${'─'.repeat(40)}\n${encrypted} encrypted, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
  process.exit(0);
})().catch(err => { console.error(err.message); process.exit(1); });
