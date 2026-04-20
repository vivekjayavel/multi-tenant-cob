'use strict';
const db                = require('../config/db');
const { ok, fail }      = require('../utils/responseUtils');
const { tenantCache }   = require('../config/cache');
const { logger }        = require('../config/logger');

exports.updateBranding = async (req, res, next) => {
  try {
    const { theme_color, name, whatsapp_number, logo_url } = req.body;
    const tenantId = req.tenant.id;
    const fields   = [];
    const values   = [];

    if (theme_color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(theme_color))
        return fail(res, 'Invalid color format. Use hex like #D97706');
      fields.push('theme_color = ?'); values.push(theme_color);
    }
    if (logo_url !== undefined) {
      // logo_url can be a path or empty string (to remove logo)
      fields.push('logo_url = ?'); values.push(logo_url || null);
    }
    if (name !== undefined) {
      if (!name.trim()) return fail(res, 'Store name cannot be empty');
      fields.push('name = ?'); values.push(name.trim());
    }
    if (whatsapp_number !== undefined) {
      if (whatsapp_number && !/^\d{10,15}$/.test(whatsapp_number))
        return fail(res, 'WhatsApp number must be 10–15 digits (no spaces or +)');
      fields.push('whatsapp_number = ?'); values.push(whatsapp_number || null);
    }

    if (!fields.length) return fail(res, 'Nothing to update');

    values.push(tenantId);
    await db.query(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`, values);

    // Bust tenant cache so new color loads on next request
    tenantCache.delete(`domain:${req.tenant.domain}`);

    logger.info('Branding updated', { tenantId, fields: fields.map(f => f.split(' ')[0]) });
    ok(res, {}, 'Branding saved');
  } catch (err) { next(err); }
};
