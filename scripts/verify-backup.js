#!/usr/bin/env node
'use strict';
require('dotenv').config();
const path = require('path');
const fs   = require('fs');
const zlib = require('zlib');
const os   = require('os');

const BACKUP_ROOT = process.env.NODE_ENV === 'production' ? path.join(os.homedir(), 'app-backups') : path.join(__dirname, '../backups');
const REQUIRED_TABLES = ['tenants','users','products','orders','order_items'];

async function verifyFile(filePath) {
  const issues = [], result = { filename: path.basename(filePath), path: filePath, valid: false, issues, checks: {} };
  if (!fs.existsSync(filePath)) { issues.push('File does not exist'); return result; }
  const stats = fs.statSync(filePath);
  result.sizeKB = Math.round(stats.size / 1024);
  if (stats.size < 1024) issues.push(`File suspiciously small (${stats.size} bytes)`);
  result.checks.size = stats.size >= 1024;
  result.ageHours = Math.round((Date.now() - stats.mtimeMs) / 3_600_000);
  let sqlContent = '', gzipOk = false;
  await new Promise(resolve => {
    const gz = zlib.createGunzip(), chunks = [];
    let bytes = 0;
    gz.on('data', c => { bytes += c.length; if (bytes <= 256 * 1024) chunks.push(c); if (bytes > 256 * 1024) gz.destroy(); });
    gz.on('end',  () => { gzipOk = true; resolve(); });
    gz.on('close',() => { sqlContent = Buffer.concat(chunks).toString('utf8'); gzipOk = gzipOk || bytes > 256 * 1024; resolve(); });
    gz.on('error',() => resolve());
    fs.createReadStream(filePath).on('error', () => resolve()).pipe(gz);
  });
  result.checks.gzip = gzipOk;
  if (!gzipOk) issues.push('Gzip decompression failed');
  const found = REQUIRED_TABLES.filter(t => sqlContent.includes(`CREATE TABLE \`${t}\``) || sqlContent.includes(`CREATE TABLE ${t}`));
  const missing = REQUIRED_TABLES.filter(t => !found.includes(t));
  result.checks.tables = found;
  if (missing.length) issues.push(`Missing tables: ${missing.join(', ')}`);
  result.valid = !issues.length && gzipOk && !missing.length;
  return result;
}

const args = process.argv.slice(2);
(async () => {
  console.log('\n🔍 Backup Verification\n' + '─'.repeat(40));
  const printResult = r => { console.log(`\n${r.valid ? '✅' : '❌'} ${r.filename}`); console.log(`   Size: ${r.sizeKB}KB  |  Age: ${r.ageHours}h`); if (r.checks.tables?.length) console.log(`   Tables: ${r.checks.tables.join(', ')}`); r.issues.forEach(i => console.log(`   ⚠️  ${i}`)); };
  if (args.includes('--all')) {
    const results = [];
    for (const type of ['daily','weekly']) { const dir = path.join(BACKUP_ROOT, type); if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.sql.gz'))) results.push(await verifyFile(path.join(dir, f))); }
    results.forEach(printResult);
    const failed = results.filter(r => !r.valid).length;
    console.log(`\nTotal: ${results.length}  Failed: ${failed}`);
    process.exit(failed ? 1 : 0);
  } else {
    const dir = path.join(BACKUP_ROOT, 'daily');
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).length) { console.error('No daily backups found'); process.exit(1); }
    const latest = path.join(dir, fs.readdirSync(dir).filter(f => f.endsWith('.sql.gz')).sort().reverse()[0]);
    const result = await verifyFile(latest);
    printResult(result);
    process.exit(result.valid ? 0 : 1);
  }
})();
