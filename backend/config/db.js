'use strict';
const mysql  = require('mysql2/promise');
const { logger } = require('./logger');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    5,
  queueLimit:         20,
  connectTimeout:     10_000,
  timezone:           '+05:30',
  charset:            'utf8mb4',
});

pool.getConnection()
  .then(conn => { logger.info('MySQL connected', { host: process.env.DB_HOST, db: process.env.DB_NAME }); conn.release(); })
  .catch(err => { logger.error('MySQL connection failed', { error: err.message }); process.exit(1); });

module.exports = pool;
