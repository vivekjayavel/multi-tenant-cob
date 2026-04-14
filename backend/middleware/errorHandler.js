'use strict';
const { logger } = require('../config/logger');
function errorHandler(err, req, res, next) {
  logger.error(err.message || 'Unhandled error', {
    requestId: req.requestId, tenantId: req.tenant?.id, userId: req.user?.userId,
    method: req.method, url: req.originalUrl, ip: req.ip, status: err.status || 500,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
  if (err.type === 'validation')          return res.status(422).json({ success: false, errors: err.errors });
  if (err.code === 'ER_DUP_ENTRY')        return res.status(409).json({ success: false, message: 'Duplicate entry — record already exists' });
  if (err.code === 'LIMIT_FILE_SIZE')     return res.status(400).json({ success: false, message: `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 5}MB` });
  if (err.code === 'INVALID_FILE_TYPE')   return res.status(400).json({ success: false, message: 'Invalid file type. Only JPG, PNG, WebP allowed' });
  const status  = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? (status < 500 ? err.message : 'Internal server error') : err.message;
  res.status(status).json({ success: false, message });
}
module.exports = errorHandler;
