'use strict';
const db       = require('../config/db');
const slugify  = require('slugify');
const { ok, fail }               = require('../utils/responseUtils');
const { invalidateProductCache } = require('../config/cache');
const { getProductsOptimized }   = require('../utils/queryOptimizer');

exports.list = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const { products, total } = await getProductsOptimized(req.tenant.id, { category, search, page, limit });
    const enriched = products.map(p => ({ ...p, available_qty: Math.max(0, (p.stock_qty || 0) - (p.reserved_qty || 0)) }));
    ok(res, { products: enriched, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, name, description, price, image_url, category, slug, stock_qty, reserved_qty, customization_options, delivery_time, created_at, updated_at FROM products WHERE tenant_id = ? AND slug = ? AND is_active = 1 LIMIT 1', [req.tenant.id, req.params.slug]);
    if (!rows.length) return fail(res, 'Product not found', 404);
    ok(res, { product: { ...rows[0], available_qty: Math.max(0, rows[0].stock_qty - rows[0].reserved_qty) } });
  } catch (err) { next(err); }
};

// Auto-add delivery_time column if missing (self-healing migration)
async function ensureDeliveryTimeColumn(db) {
  try { await db.query('SELECT delivery_time FROM products LIMIT 1'); }
  catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      await db.query('ALTER TABLE products ADD COLUMN delivery_time VARCHAR(100) DEFAULT NULL AFTER description');
    }
  }
}

exports.create = async (req, res, next) => {
  try {
    await ensureDeliveryTimeColumn(db);
    const { name, description, price, image_url, category, stock_qty = 0, customization_options, delivery_time } = req.body;
    const tenantId = req.tenant.id;
    const slug = req.body.slug || slugify(name, { lower: true, strict: true });
    let custOpts = null;
    if (customization_options !== undefined && customization_options !== null) {
      custOpts = typeof customization_options === 'string'
        ? customization_options
        : JSON.stringify(customization_options);
    }
    const [result] = await db.query('INSERT INTO products (tenant_id, name, description, price, image_url, category, slug, stock_qty, customization_options, delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [tenantId, name, description, price, image_url, category, slug, stock_qty, custOpts, delivery_time || null]);
    invalidateProductCache(tenantId);
    ok(res, { id: result.insertId, slug }, 'Product created', 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    await ensureDeliveryTimeColumn(db);
    const { id } = req.params, tenantId = req.tenant.id;
    const allowed = ['name','description','price','image_url','category','slug','is_active','stock_qty','customization_options','delivery_time'];
    const fields = [], values = [];

    // If stock_qty is being reduced, cap reserved_qty to not exceed new stock_qty
    // This prevents violating the chk_reserved_lte_stock constraint
    if (req.body.stock_qty !== undefined) {
      const newStock = parseInt(req.body.stock_qty, 10) || 0;
      fields.push('stock_qty = ?');
      fields.push('reserved_qty = LEAST(reserved_qty, ?)');
      values.push(newStock, newStock);
    }

    for (const key of allowed) {
      if (key === 'stock_qty') continue; // already handled above
      if (req.body[key] !== undefined) {
        let val = req.body[key];
        // JSON column: mysql2 needs a string, not an object
        if (key === 'customization_options' && val !== null && typeof val === 'object') {
          val = JSON.stringify(val);
        }
        // Treat empty string as NULL for JSON column
        if (key === 'customization_options' && val === '') val = null;
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (!fields.length) return fail(res, 'No valid fields to update');
    values.push(id, tenantId);
    const [result] = await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, values);
    if (!result.affectedRows) return fail(res, 'Product not found', 404);
    invalidateProductCache(tenantId);
    ok(res, {}, 'Product updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await db.query('UPDATE products SET is_active = 0 WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenant.id]);
    if (!result.affectedRows) return fail(res, 'Product not found', 404);
    invalidateProductCache(req.tenant.id);
    ok(res, {}, 'Product deleted');
  } catch (err) { next(err); }
};
