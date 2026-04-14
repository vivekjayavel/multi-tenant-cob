#!/usr/bin/env node
'use strict';
require('dotenv').config();
const { spawn }     = require('child_process');
const path          = require('path');
const fs            = require('fs');
const zlib          = require('zlib');
const readline      = require('readline');
const os            = require('os');
const { runBackup } = require('./backup');

const DB = { host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || '3306', user: process.env.DB_USER, password: process.env.DB_PASSWORD, name: process.env.DB_NAME };
const BACKUP_ROOT = process.env.NODE_ENV === 'production' ? path.join(os.homedir(), 'app-backups') : path.join(__dirname, '../backups');

function findLatest(type = 'daily') {
  const dir = path.join(BACKUP_ROOT, type);
  if (!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir).filter(f => f.endsWith('.sql.gz')).map(f => ({ path: path.join(dir, f), mtime: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.mtime - a.mtime)[0]?.path ?? null;
}

function confirm(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => { rl.question(`${q} (type "yes"): `, a => { rl.close(); resolve(a.trim().toLowerCase() === 'yes'); }); });
}

async function restore(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Not found: ${filePath}`);
  const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
  console.log(`\n${'─'.repeat(50)}\n  RESTORE: ${path.basename(filePath)} (${sizeKB}KB)\n  Database: ${DB.name}\n${'─'.repeat(50)}\n⚠️  This will OVERWRITE the current database.\n`);
  if (!await confirm('Confirm?')) { console.log('Cancelled.'); process.exit(0); }
  console.log('\n📦 Creating safety backup...');
  try { const s = await runBackup('daily'); console.log(`✅ Safety backup: ${s.filename}`); }
  catch (err) { console.error(`❌ Safety backup failed: ${err.message}`); if (!await confirm('Proceed anyway?')) process.exit(1); }
  console.log('\n🔄 Restoring...');
  await new Promise((resolve, reject) => {
    const env  = { ...process.env, MYSQL_PWD: DB.password };
    const cmd  = `mysql --host=${DB.host} --port=${DB.port} --user=${DB.user} --default-character-set=utf8mb4 ${DB.name}`;
    const proc = spawn('bash', ['-c', cmd], { env });
    const gz   = zlib.createGunzip();
    fs.createReadStream(filePath).pipe(gz).pipe(proc.stdin);
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d; });
    proc.on('close', code => { code !== 0 ? reject(new Error(`mysql exited ${code}: ${stderr}`)) : resolve(); });
    proc.on('error', reject);
  });
  console.log('\n✅ Restore complete. Restart the app: pm2 restart bakery-platform\n');
}

const args = process.argv.slice(2);
let filePath;
if (args.includes('--latest'))         filePath = findLatest('daily');
else if (args.includes('--latest-weekly')) filePath = findLatest('weekly');
else { const i = args.indexOf('--file'); if (i !== -1) filePath = path.resolve(args[i + 1]); }
if (!filePath) { console.error('Usage: node scripts/restore.js --latest | --latest-weekly | --file <path>'); process.exit(1); }
restore(filePath).catch(err => { console.error('❌', err.message); process.exit(1); });
