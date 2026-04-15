'use strict';
const db = require('../config/db');
const { tenantCache } = require('../config/cache');
const { logger }      = require('../config/logger');

async function tenantMiddleware(req, res, next) {
  try {
    const domain   = (req.headers.host || '').split(':')[0].toLowerCase();
    if (!domain) return res.status(400).json({ success: false, message: 'Missing host header' });
    const cacheKey = `domain:${domain}`;
    const cached   = tenantCache.get(cacheKey);
    if (cached) { req.tenant = cached; return next(); }
    const [rows] = await db.query(
      `SELECT id, name, domain, logo_url, theme_color, whatsapp_number, razorpay_key_id, razorpay_key_secret
       FROM tenants WHERE domain = ? AND is_active = 1 LIMIT 1`, [domain]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: `No active tenant for domain: ${domain}` });
    tenantCache.set(cacheKey, rows[0]);
    req.tenant = rows[0];
    next();
  } catch (err) { next(err); }
}
tenantMiddleware.invalidate = (domain) => tenantCache.delete(`domain:${domain}`);
module.exports = tenantMiddleware;
