#!/usr/bin/env node
'use strict';

/**
 * Dev startup script — runs Express API (port 3001) and Next.js (port 3000) together.
 * Usage: npm run dev:all
 *
 * Next.js proxies /api/* and /uploads/* to Express via next.config.js rewrites.
 */

require('dotenv').config();
const { spawn } = require('child_process');

const procs = [];

function run(label, cmd, args, env = {}) {
  const proc = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  });
  proc.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
      procs.forEach(p => p.kill());
      process.exit(code);
    }
  });
  procs.push(proc);
  return proc;
}

console.log('\n🎂 Bakery Platform — Dev Servers\n');
console.log('  Express API  → http://localhost:3001');
console.log('  Next.js App  → http://localhost:3000\n');

// Start Express API on port 3001
run('API', 'node', ['server.js'], {
  NODE_ENV: 'development',
  PORT: '3001',
});

// Give Express a moment to start, then start Next.js
setTimeout(() => {
  run('NEXT', 'npx', ['next', 'dev', 'frontend', '-p', '3000']);
}, 1500);

process.on('SIGINT',  () => { procs.forEach(p => p.kill()); process.exit(0); });
process.on('SIGTERM', () => { procs.forEach(p => p.kill()); process.exit(0); });
