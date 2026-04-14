// All requires are LAZY (inside functions) to prevent db.js from
// loading at import time during Next.js build phase.

async function getTenantFromRequest(req) {
  const db = require('../../backend/config/db');
  const { tenantCache } = require('../../backend/config/cache');

  const domain   = (req.headers.host || '').split(':')[0].toLowerCase();
  const cacheKey = `domain:${domain}`;
  const cached   = tenantCache.get(cacheKey);
  if (cached) return cached;

  const [[tenant]] = await db.execute(
    'SELECT id, name, domain, logo_url, theme_color, whatsapp_number FROM tenants WHERE domain = ? AND is_active = 1 LIMIT 1',
    [domain]
  );
  if (tenant) tenantCache.set(cacheKey, tenant);
  return tenant || null;
}

async function getProductsForPage(tenantId, category = null) {
  const db = require('../../backend/config/db');
  const { productCache, buildKey } = require('../../backend/config/cache');

  const cacheKey = buildKey(tenantId, 'products', category || 'all');
  const cached   = productCache.get(cacheKey);
  if (cached) return cached;

  const [products] = await db.execute(
    `SELECT id, name, description, price, image_url, category, slug, stock_qty, reserved_qty
     FROM products
     WHERE tenant_id = ? AND is_active = 1
     ${category ? 'AND category = ?' : ''}
     ORDER BY created_at DESC`,
    category ? [tenantId, category] : [tenantId]
  );
  const enriched   = products.map(p => ({ ...p, available_qty: Math.max(0, p.stock_qty - p.reserved_qty) }));
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

  const [products] = await db.execute(
    'SELECT id, name, description, price, image_url, category, slug, stock_qty, reserved_qty FROM products WHERE tenant_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT ?',
    [tenantId, limit]
  );
  const enriched   = products.map(p => ({ ...p, available_qty: Math.max(0, p.stock_qty - p.reserved_qty) }));
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

module.exports = { getTenantFromRequest, getProductsForPage, getFeaturedProducts, notFoundOrProps };
