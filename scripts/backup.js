#!/usr/bin/env node
'use strict';
require('dotenv').config();
const { spawn } = require('child_process');
const path      = require('path');
const fs        = require('fs');
const zlib      = require('zlib');
const os        = require('os');
const { logger } = require('../backend/config/logger');

const DB = { host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || '3306', user: process.env.DB_USER, password: process.env.DB_PASSWORD, name: process.env.DB_NAME };
const BACKUP_ROOT = process.env.NODE_ENV === 'production' ? path.join(os.homedir(), 'app-backups') : path.join(__dirname, '../backups');
const DIRS = { daily: path.join(BACKUP_ROOT, 'daily'), weekly: path.join(BACKUP_ROOT, 'weekly'), manifests: path.join(BACKUP_ROOT, 'manifests') };
const RETENTION = { daily: 7, weekly: 4 };
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

async function runBackup(type = 'daily') {
  if (!DB.user || !DB.password || !DB.name) throw new Error('DB credentials missing');
  const now       = new Date();
  const timestamp = now.toISOString().replace('T', '_').replace(/:/g, '-').slice(0, 19);
  const filename  = `bakery_${timestamp}.sql.gz`;
  const destPath  = path.join(DIRS[type], filename);
  const startMs   = Date.now();
  logger.info(`Starting ${type} backup`, { database: DB.name });
  await new Promise((resolve, reject) => {
    const env  = { ...process.env, MYSQL_PWD: DB.password };
    const cmd  = `mysqldump --host=${DB.host} --port=${DB.port} --user=${DB.user} --single-transaction --routines --triggers --add-drop-table ${DB.name}`;
    const proc = spawn('bash', ['-c', cmd], { env });
    const gzip = zlib.createGzip({ level: 9 });
    const out  = fs.createWriteStream(destPath);
    proc.stdout.pipe(gzip).pipe(out);
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    out.on('finish', () => { if (proc.exitCode !== null && proc.exitCode !== 0) { fs.unlink(destPath, () => {}); reject(new Error(`mysqldump failed: ${stderr}`)); } else resolve(); });
    out.on('error', err => { proc.kill(); reject(err); });
    proc.on('close', code => { if (code !== 0) { fs.unlink(destPath, () => {}); reject(new Error(`Exit ${code}: ${stderr}`)); } });
  });
  const stats = fs.statSync(destPath), sizeKB = Math.round(stats.size / 1024), duration = Date.now() - startMs;
  const files = fs.readdirSync(DIRS[type]).filter(f => f.endsWith('.sql.gz')).map(f => ({ name: f, path: path.join(DIRS[type], f), mtime: fs.statSync(path.join(DIRS[type], f)).mtimeMs })).sort((a, b) => a.mtime - b.mtime);
  files.slice(0, Math.max(0, files.length - RETENTION[type])).forEach(f => { fs.unlinkSync(f.path); logger.info('Pruned backup', { type, filename: f.name }); });
  const manifestPath = path.join(DIRS.manifests, `${new Date().toISOString().slice(0, 10)}.json`);
  fs.appendFileSync(manifestPath, JSON.stringify({ type, filename, timestamp: now.toISOString(), database: DB.name, sizeBytes: stats.size, sizeKB, durationMs: duration, success: true }) + '\n');
  logger.info('Backup complete', { type, filename, sizeKB, durationMs: duration });
  return { filename, sizeKB, durationMs: duration };
}

const args = process.argv.slice(2);
const type = args.includes('--weekly') ? 'weekly' : 'daily';
if (require.main === module) {
  runBackup(type).then(({ filename, sizeKB }) => { console.log(`✅ ${filename} (${sizeKB}KB)`); process.exit(0); }).catch(err => { console.error('❌', err.message); process.exit(1); });
}
module.exports = { runBackup };
