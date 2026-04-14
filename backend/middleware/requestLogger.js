'use strict';
const morgan = require('morgan');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');
const { logger } = require('../config/logger');

morgan.token('tenant-id',  (req) => req.tenant?.id ?? '-');
morgan.token('user-id',    (req) => req.user?.userId ?? '-');
morgan.token('real-ip',    (req) => req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.ip ?? '-');
morgan.token('request-id', (req) => req.requestId ?? '-');

const FORMAT = ':real-ip | :method | :url | :status | :response-time ms | tenant=:tenant-id | rid=:request-id';
const LOG_DIR = process.env.NODE_ENV === 'production' ? path.join(os.homedir(), 'app-logs') : path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const accessStream = fs.createWriteStream(path.join(LOG_DIR, 'access.log'), { flags: 'a' });
const fileLogger   = morgan(FORMAT, { stream: accessStream });

const winstonStream = {
  write(message) {
    const line = message.trim(), parts = line.split('|'), status = parseInt((parts[3] || '').trim(), 10);
    if (status >= 500)      logger.error(`HTTP ${status}`, { request: line });
    else if (status >= 400) logger.warn(`HTTP ${status}`, { request: line });
  },
};
const winstonLogger = morgan(FORMAT, { stream: winstonStream, skip: (req, res) => res.statusCode < 400 });

function slowRequestDetector(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms > 2000) logger.warn('Slow request', { method: req.method, url: req.originalUrl, ms, status: res.statusCode });
  });
  next();
}

module.exports = { fileLogger, winstonLogger, slowRequestDetector };
