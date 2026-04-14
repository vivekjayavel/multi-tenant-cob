'use strict';
const nodemailer = require('nodemailer');
const { logger } = require('./logger');

const transport = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  pool: true, maxConnections: 3, maxMessages: 100,
  connectionTimeout: 10_000, greetingTimeout: 8_000, socketTimeout: 30_000,
});

if (process.env.NODE_ENV !== 'production') {
  transport.verify((err) => {
    if (err) logger.warn('SMTP verification failed', { error: err.message, host: process.env.SMTP_HOST });
    else logger.info('SMTP connection verified');
  });
}

module.exports = transport;
