#!/usr/bin/env node
'use strict';
const https = require('https');
const http  = require('http');
const baseUrl = process.argv[2];
if (!baseUrl) { console.error('Usage: node scripts/verify-file-security.js https://yourdomain.com'); process.exit(1); }

const MUST_BE_BLOCKED = ['/.env','/.env.production','/package.json','/server.js','/backend/config/db.js','/database/schema.sql','/scripts/backup.js','/logs/','/backups/','/node_modules/express/package.json','/.git/config'];
const MUST_BE_ACCESSIBLE = ['/','/products','/sitemap.xml','/robots.txt'];

function checkUrl(url) {
  return new Promise(resolve => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 8000 }, res => resolve({ url, status: res.statusCode }));
    req.on('error', () => resolve({ url, status: 'ERROR' }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 'TIMEOUT' }); });
  });
}

(async () => {
  console.log(`\n🔒 Security Verification: ${baseUrl}\n${'─'.repeat(50)}`);
  let passed = 0, failed = 0;
  console.log('\n📛 Sensitive files (must return 403 or 404):');
  for (const p of MUST_BE_BLOCKED) {
    const { status } = await checkUrl(`${baseUrl}${p}`);
    if (status === 200) { console.log(`  ❌ EXPOSED  [${status}] ${p}`); failed++; }
    else                { console.log(`  ✅ blocked  [${status}] ${p}`); passed++; }
  }
  console.log('\n✅ Public paths (must return 200):');
  for (const p of MUST_BE_ACCESSIBLE) {
    const { status } = await checkUrl(`${baseUrl}${p}`);
    if (status === 200) { console.log(`  ✅ ok       [${status}] ${p}`); passed++; }
    else                { console.log(`  ❌ BROKEN   [${status}] ${p}`); failed++; }
  }
  console.log(`\n${'─'.repeat(50)}\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) { console.error('⚠️  CRITICAL: Fix before accepting real traffic.\n'); process.exit(1); }
  console.log('✅ All checks passed.\n');
})();
