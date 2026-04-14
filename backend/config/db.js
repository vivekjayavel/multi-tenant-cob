'use strict';

const mysql = require('mysql2/promise');

// Don't attempt DB connection during Next.js build phase
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' ||
                     process.env.NEXT_PHASE === 'phase-export';

// Note: Do NOT include timezone or charset in pool options —
// they cause "Incorrect arguments to mysqld_stmt_execute" in mysql2.
// MySQL 8 defaults (utf8mb4, server timezone) are used instead.
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
});

if (!isBuildPhase) {
  pool.getConnection()
    .then(conn => {
      try {
        const { logger } = require('./logger');
        logger.info('MySQL connected', { host: process.env.DB_HOST, db: process.env.DB_NAME });
      } catch { console.log('✅ MySQL connected'); }
      conn.release();
    })
    .catch(err => {
      try {
        const { logger } = require('./logger');
        logger.error('MySQL connection failed', { error: err.message });
      } catch { console.error('❌ MySQL connection failed:', err.message); }
      if (process.env.NODE_ENV === 'production') process.exit(1);
    });
}

module.exports = pool;
