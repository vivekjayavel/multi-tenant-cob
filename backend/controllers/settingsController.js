'use strict';
const path   = require('path');
const fs     = require('fs');
const db     = require('../config/db');
const { ok, fail }        = require('../utils/responseUtils');
const { tenantCache }     = require('../config/cache');
const { logger }          = require('../config/logger');

const DEFAULT_SETTINGS = {
  hero: {
    badge:            'Fresh Baked Daily',
    heading:          'Handcrafted with Love & Butter',
    subheading:       'From our oven to your table — every cake, croissant and pastry is baked fresh each morning.',
    image_url:        '',
    images:           [],  // array of { url } for slideshow
    cta_primary:      'Explore Menu',
    cta_whatsapp:     'Order via WhatsApp',
    overlay_enabled:    true,
    overlay_intensity:  'medium', // 'light' | 'medium' | 'strong'
    show_text_content:  true,  // toggle badge/heading/subheading/CTAs/stats
    stats: [
      { value: '500+', label: 'Happy customers' },
      { value: '50+',  label: 'Menu items'      },
      { value: '100%', label: 'Fresh daily'      },
    ],
  },
  features: [
    { icon: '🌾', title: 'Real Ingredients',  desc: 'No preservatives, no shortcuts. Every recipe uses premium, natural ingredients.' },
    { icon: '⏰', title: 'Baked Fresh Daily', desc: 'Everything is baked fresh every morning. We never sell day-old products.' },
    { icon: '🚚', title: 'Same-Day Delivery', desc: 'Order before noon and get delivery by evening within the city.' },
  ],
  footer: {
    tagline: 'Fresh baked goods crafted with love and the finest ingredients.',
    address: '',
    email:   '',
    phone:   '',
    hours:   '',
    links: [
      { label: 'Home',    href: '/'         },
      { label: 'Menu',    href: '/products'  },
      { label: 'Cart',    href: '/cart'      },
      { label: 'Account', href: '/login'     },
    ],
  },
  seo: {
    meta_title:       '',
    meta_description: '',
  },
};

function mergeDeep(defaults, overrides) {
  if (!overrides) return defaults;
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (Array.isArray(overrides[key])) {
      result[key] = overrides[key];
    } else if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = mergeDeep(defaults[key] || {}, overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

exports.getSettings = async (req, res, next) => {
  try {
    let saved = {};
    try {
      const [[tenant]] = await db.query(
        'SELECT tenant_settings FROM tenants WHERE id = ? LIMIT 1',
        [req.tenant.id]
      );
      if (tenant?.tenant_settings) {
        saved = typeof tenant.tenant_settings === 'string'
          ? JSON.parse(tenant.tenant_settings)
          : tenant.tenant_settings;
      }
    } catch (dbErr) {
      // Column doesn't exist yet — auto-create it then return defaults
      if (dbErr.code === 'ER_BAD_FIELD_ERROR' || dbErr.message?.includes('tenant_settings')) {
        try {
          await db.query('ALTER TABLE tenants ADD COLUMN tenant_settings JSON DEFAULT NULL AFTER whatsapp_number');
          logger.info('Auto-created tenant_settings column');
        } catch (alterErr) {
          if (!alterErr.message?.includes('Duplicate column')) {
            logger.error('Failed to create tenant_settings column', { error: alterErr.message });
          }
        }
      }
      // Return defaults either way
    }
    const settings = mergeDeep(DEFAULT_SETTINGS, saved);
    ok(res, { settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { section, data } = req.body;
    if (!section || !data) return fail(res, 'section and data are required');

    const allowed = ['hero','features','footer','seo'];
    if (!allowed.includes(section)) return fail(res, `Invalid section: ${section}`);

    let current = {};
    try {
      const [[tenant]] = await db.query(
        'SELECT tenant_settings FROM tenants WHERE id = ? LIMIT 1',
        [req.tenant.id]
      );
      if (tenant?.tenant_settings) {
        current = typeof tenant.tenant_settings === 'string'
          ? JSON.parse(tenant.tenant_settings)
          : tenant.tenant_settings;
      }
    } catch (dbErr) {
      if (dbErr.code === 'ER_BAD_FIELD_ERROR' || dbErr.message?.includes('tenant_settings')) {
        try {
          await db.query('ALTER TABLE tenants ADD COLUMN tenant_settings JSON DEFAULT NULL AFTER whatsapp_number');
          logger.info('Auto-created tenant_settings column');
        } catch (alterErr) {
          if (!alterErr.message?.includes('Duplicate column')) throw alterErr;
        }
      }
    }

    current[section] = data;

    await db.query(
      'UPDATE tenants SET tenant_settings = ? WHERE id = ?',
      [JSON.stringify(current), req.tenant.id]
    );

    // Invalidate tenant cache so updated settings are picked up immediately
    const domain = req.tenant.domain;
    tenantCache.delete(`domain:${domain}`);

    logger.info('Tenant settings updated', { tenantId: req.tenant.id, section });
    ok(res, {}, 'Settings saved');
  } catch (err) { next(err); }
};

exports.uploadHeroImage = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);
    const tenantId    = req.tenant.id;
    const relativePath = `${tenantId}/hero/${req.file.filename}`.replace(/\\/g, '/');
    const publicUrl    = `/uploads/${relativePath}`;
    ok(res, { url: publicUrl }, 'Hero image uploaded', 201);
  } catch (err) { next(err); }
};

exports.uploadBannerImage = async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded', 400);
    const tenantId    = req.tenant.id;
    const relativePath = `${tenantId}/banner/${req.file.filename}`.replace(/\\/g, '/');
    const publicUrl    = `/uploads/${relativePath}`;
    ok(res, { url: publicUrl }, 'Banner image uploaded', 201);
  } catch (err) { next(err); }
};
