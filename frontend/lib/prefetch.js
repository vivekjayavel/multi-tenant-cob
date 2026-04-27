// All requires are LAZY (inside functions) to prevent db.js from
// loading at import time during Next.js build phase.
// Uses db.query() instead of db.execute() to avoid MySQL 8 prepared
// statement issues ("Incorrect arguments to mysqld_stmt_execute").

async function getTenantFromRequest(req) {
  // Always fetch fresh from DB — no cache.
  // In dev, Next.js and Express run in separate processes with separate
  // in-memory caches. Caching here would show stale theme_color/settings
  // after admin changes. Tenant queries are tiny (1 row, indexed) so
  // the DB hit is negligible.
  const db     = require('../../backend/config/db');
  const rawDomain = req.headers['x-forwarded-host'] || req.headers.host || '';
  const domain = (rawDomain || process.env.DEFAULT_DOMAIN || process.env.NEXT_PUBLIC_DOMAIN || '').split(':')[0].toLowerCase();

  const [rows] = await db.query(
    'SELECT id, name, domain, logo_url, theme_color, whatsapp_number, tenant_settings FROM tenants WHERE domain = ? AND is_active = 1 LIMIT 1',
    [domain]
  );
  return rows[0] || null;
}

async function getProductsForPage(tenantId, category = null) {
  const db = require('../../backend/config/db');
  const { productCache, buildKey } = require('../../backend/config/cache');

  const cacheKey = buildKey(tenantId, 'products', category || 'all');
  const cached   = productCache.get(cacheKey);
  if (cached) return cached;

  const params = category ? [tenantId, category] : [tenantId];
  const sql = `SELECT id, name, description, price, image_url, images, category, slug, stock_qty, reserved_qty, customization_options, delivery_time, sort_order
               FROM products
               WHERE tenant_id = ? AND is_active = 1
               ${category ? 'AND category = ?' : ''}
               ORDER BY sort_order ASC, created_at DESC`;

  const [products] = await db.query(sql, params);
  const enriched   = products.map(p => ({
    ...p,
    available_qty: Math.max(0, p.stock_qty - p.reserved_qty),
    customization_options: p.customization_options
      ? (typeof p.customization_options === 'string'
          ? p.customization_options
          : JSON.stringify(p.customization_options))
      : null,
    images: p.images
      ? (typeof p.images === 'string' ? p.images : JSON.stringify(p.images))
      : null,
  }));
  const serialized = JSON.parse(JSON.stringify(enriched));
  productCache.set(cacheKey, serialized);
  return serialized;
}

async function getFeaturedProducts(tenantId, limit = 8) {
  const db = require('../../backend/config/db');
  const { productCache, buildKey } = require('../../backend/config/cache');

  const cacheKey = buildKey(tenantId, 'featured', String(limit));
  const cached   = productCache.get(cacheKey);
  if (cached) return cached;

  const [products] = await db.query(
    'SELECT id, name, description, price, image_url, images, category, slug, stock_qty, reserved_qty, customization_options, delivery_time, sort_order FROM products WHERE tenant_id = ? AND is_active = 1 ORDER BY sort_order ASC, created_at DESC LIMIT ?',
    [tenantId, limit]
  );
  const enriched   = products.map(p => ({
    ...p,
    available_qty: Math.max(0, p.stock_qty - p.reserved_qty),
    customization_options: p.customization_options
      ? (typeof p.customization_options === 'string'
          ? p.customization_options
          : JSON.stringify(p.customization_options))
      : null,
    images: p.images
      ? (typeof p.images === 'string' ? p.images : JSON.stringify(p.images))
      : null,
  }));
  const serialized = JSON.parse(JSON.stringify(enriched));
  productCache.set(cacheKey, serialized);
  return serialized;
}

function notFoundOrProps(data) {
  for (const [, val] of Object.entries(data)) {
    if (val === null || val === undefined) return { notFound: true };
  }
  return { props: JSON.parse(JSON.stringify(data)) };
}

async function getProductsByCategory(tenantId) {
  const db = require('../../backend/config/db');
  const [products] = await db.query(
    `SELECT id, name, description, price, image_url, images, category, slug,
            stock_qty, reserved_qty, customization_options, delivery_time, sort_order
     FROM products
     WHERE tenant_id = ? AND is_active = 1
     ORDER BY category ASC, sort_order ASC, created_at DESC`,
    [tenantId]
  );

  // Group by category
  const grouped = {};
  for (const p of products) {
    const cat = p.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({
      ...p,
      available_qty: Math.max(0, p.stock_qty - p.reserved_qty),
      customization_options: p.customization_options
        ? (typeof p.customization_options === 'string'
            ? p.customization_options
            : JSON.stringify(p.customization_options))
        : null,
    });
  }

  // Return as array of { category, products } — Cakes first, then alphabetical
  const PRIORITY = ['cakes', 'cake'];
  return Object.entries(grouped)
    .sort(([a], [b]) => {
      const aP = PRIORITY.includes(a.toLowerCase());
      const bP = PRIORITY.includes(b.toLowerCase());
      if (aP && !bP) return -1;
      if (!aP && bP) return  1;
      return a.localeCompare(b);
    })
    .map(([category, prods]) => ({
      category,
      // Sort within category by sort_order ASC then created_at DESC
      products: JSON.parse(JSON.stringify(
        [...prods].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map(p => ({
            ...p,
            images: p.images
              ? (typeof p.images === 'string' ? p.images : JSON.stringify(p.images))
              : null,
          }))
      )),
    }));
}

async function getCategories(tenantId) {
  const db = require('../../backend/config/db');
  const [rows] = await db.query(
    `SELECT DISTINCT category FROM products
     WHERE tenant_id = ? AND is_active = 1 AND category IS NOT NULL AND category != ''
     ORDER BY category ASC`,
    [tenantId]
  );
  const cats = rows.map(r => r.category).filter(Boolean);
  // Cakes first
  return cats.sort((a, b) => {
    if (a.toLowerCase().includes('cake') && !b.toLowerCase().includes('cake')) return -1;
    if (!a.toLowerCase().includes('cake') && b.toLowerCase().includes('cake')) return 1;
    return a.localeCompare(b);
  });
}

module.exports = { getTenantFromRequest, getProductsForPage, getFeaturedProducts, getProductsByCategory, getCategories, notFoundOrProps };
