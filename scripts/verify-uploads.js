#!/usr/bin/env node
/**
 * Upload verification script
 * Run: node scripts/verify-uploads.js
 * Tests that uploads directory structure is correct and files are accessible
 */
'use strict';
require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const http = require('http');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PORT        = process.env.PORT || 3001;

function checkDirectory(dir, label) {
  if (!fs.existsSync(dir)) {
    console.log(`  ❌ Missing: ${label} (${dir})`);
    return false;
  }
  const files = fs.readdirSync(dir);
  console.log(`  ✅ ${label}: ${files.length} file(s) — ${dir}`);
  if (files.length > 0) {
    files.slice(0, 3).forEach(f => console.log(`     • ${f}`));
    if (files.length > 3) console.log(`     … and ${files.length - 3} more`);
  }
  return true;
}

function httpGet(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => resolve({ status: res.statusCode, headers: res.headers }))
      .on('error', (err) => resolve({ status: 0, error: err.message }));
  });
}

async function run() {
  console.log('\n🔍 Upload Verification\n' + '─'.repeat(50));

  // 1. Check directory structure
  console.log('\n📁 Directory Structure:');
  const uploadsExists = checkDirectory(UPLOADS_DIR, 'uploads/');
  if (!uploadsExists) {
    console.log('\n  Fix: mkdir uploads\\1\\products && mkdir uploads\\1\\logo');
    return;
  }

  // Find all tenant directories
  const tenantDirs = fs.readdirSync(UPLOADS_DIR)
    .filter(f => /^\d+$/.test(f) && fs.statSync(path.join(UPLOADS_DIR, f)).isDirectory());
  
  if (tenantDirs.length === 0) {
    console.log('  ⚠️  No tenant directories found');
    console.log('  Fix: mkdir uploads\\1\\products && mkdir uploads\\1\\logo');
  } else {
    for (const tenantId of tenantDirs) {
      const tenantDir = path.join(UPLOADS_DIR, tenantId);
      console.log(`\n  Tenant ${tenantId}:`);
      ['products', 'logo', 'hero', 'banner'].forEach(subdir => {
        const fullDir = path.join(tenantDir, subdir);
        if (fs.existsSync(fullDir)) {
          const files = fs.readdirSync(fullDir).filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f));
          console.log(`    ${subdir}/: ${files.length} image(s)`);
          files.slice(0, 2).forEach(f => {
            const size = fs.statSync(path.join(fullDir, f)).size;
            console.log(`      • ${f} (${Math.round(size/1024)}KB)`);
          });
        }
      });
    }
  }

  // 2. Test HTTP serving
  console.log('\n🌐 HTTP Serving Test:');
  
  // Find a real uploaded file to test
  let testFile = null;
  outer: for (const tenantId of tenantDirs) {
    for (const subdir of ['products', 'logo', 'hero', 'banner']) {
      const dir   = path.join(UPLOADS_DIR, tenantId, subdir);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
      if (files.length > 0) { testFile = `/uploads/${tenantId}/${subdir}/${files[0]}`; break outer; }
    }
  }

  if (!testFile) {
    console.log('  ⚠️  No uploaded images found to test serving');
    console.log('  Upload a product image via the admin panel first, then re-run');
  } else {
    const url = `http://localhost:${PORT}${testFile}`;
    const res = await httpGet(url);
    if (res.status === 200) {
      console.log(`  ✅ Serving OK: ${testFile}`);
      console.log(`     Content-Type: ${res.headers['content-type']}`);
    } else if (res.status === 403) {
      console.log(`  ❌ 403 Forbidden: ${testFile}`);
      console.log('  The uploads middleware is rejecting the path.');
      console.log('  Check server.js upload validation logic.');
    } else if (res.status === 404) {
      console.log(`  ❌ 404 Not Found: ${testFile}`);
      console.log('  File exists on disk but Express cannot find it.');
    } else if (res.status === 0) {
      console.log(`  ⚠️  Cannot connect to ${url}`);
      console.log('  Make sure npm run dev:api is running on port 3001');
    } else {
      console.log(`  ❌ HTTP ${res.status}: ${testFile}`);
    }
  }

  // 3. Test a bad path (should be blocked)
  console.log('\n🔒 Security Test:');
  const badPaths = [
    '/uploads/../server.js',
    '/uploads/1/products/../../../package.json',
    '/uploads/1/notallowed/test.jpg',
  ];
  for (const bad of badPaths) {
    const res = await httpGet(`http://localhost:${PORT}${bad}`);
    if (res.status === 403 || res.status === 404) {
      console.log(`  ✅ Blocked (${res.status}): ${bad}`);
    } else {
      console.log(`  ❌ NOT BLOCKED (${res.status}): ${bad} ← Security issue!`);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✅ Verification complete.\n');
}

run().catch(console.error);
