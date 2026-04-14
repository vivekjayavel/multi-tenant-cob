'use strict';
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const LOG_DIR = process.env.NODE_ENV === 'production'
  ? path.join(os.homedir(), 'app-logs')
  : path.join(__dirname, '../../logs');

// Ensure log directory exists (safe during build too)
try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
} catch { /* ignore during build */ }

// During Next.js build phase, return a no-op logger to avoid
// winston trying to write files or load native modules
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' ||
                     process.env.NEXT_PHASE === 'phase-export';

if (isBuildPhase) {
  const noop = () => {};
  const noopLogger = { info: noop, warn: noop, error: noop, debug: noop };
  module.exports = { logger: noopLogger, paymentLogger: noopLogger };
} else {
  const winston         = require('winston');
  const DailyRotateFile = require('winston-daily-rotate-file');

  const lineFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const tenant = meta.tenantId ? `[tenant:${meta.tenantId}] ` : '';
    delete meta.tenantId;
    const hasMeta = Object.keys(meta).length > 0 && !(Object.keys(meta).length === 1 && meta.service);
    const metaStr = hasMeta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level.toUpperCase().padEnd(7)} ${tenant}${message}${metaStr}`;
  });

  const sharedFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    lineFormat
  );

  function rotatingTransport({ filename, level, maxFiles = '14d' }) {
    return new DailyRotateFile({
      filename:      path.join(LOG_DIR, `${filename}-%DATE%.log`),
      datePattern:   'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles,
      level,
      format:        sharedFormat,
      auditFile:     path.join(LOG_DIR, `${filename}-audit.json`),
    });
  }

  const transports = [
    rotatingTransport({ filename: 'combined', level: 'info'  }),
    rotatingTransport({ filename: 'error',    level: 'error' }),
  ];

  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        lineFormat
      ),
    }));
  }

  const logger = winston.createLogger({
    level:       process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'bakery-platform' },
    transports,
    exitOnError: false,
  });

  const paymentLogger = winston.createLogger({
    level:       'info',
    defaultMeta: { service: 'bakery-payments' },
    transports: [
      rotatingTransport({ filename: 'payments', level: 'info', maxFiles: '90d' }),
      rotatingTransport({ filename: 'error',    level: 'error' }),
    ],
    exitOnError: false,
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: reason instanceof Error ? reason.stack : reason });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { stack: err.stack });
    setTimeout(() => process.exit(1), 1000);
  });

  module.exports = { logger, paymentLogger };
}
