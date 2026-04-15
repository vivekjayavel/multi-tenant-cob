#!/usr/bin/env node
'use strict';

// Dev startup: runs both Next.js dev server and Express API server concurrently
const { spawn } = require('child_process');

process.env.NODE_ENV = 'development';

function start(cmd, args, env = {}) {
  const proc = spawn(cmd, args, {
    stdio:  'inherit',
    shell:  true,
    env:    { ...process.env, ...env },
  });
  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Process ${cmd} exited with code ${code}`);
      process.exit(code);
    }
  });
  return proc;
}

console.log('Starting bakery platform dev servers...\n');
console.log('  Next.js frontend: http://localhost:3000');
console.log('  Express API:      http://localhost:3001\n');

// Start Express API server on port 3001
const api = start('node', ['server.js'], { PORT: '3001', API_ONLY: 'true' });

// Start Next.js dev server on port 3000 (with API proxy to :3001)
setTimeout(() => {
  start('npx', ['next', 'dev', 'frontend', '-p', '3000']);
}, 1000);

process.on('SIGINT', () => {
  api.kill();
  process.exit(0);
});
