'use strict';
const db     = require('../config/db');
const { ok, fail }               = require('../utils/responseUtils');
const { invalidateProductCache } = require('../config/cache');

exports.create = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { items, delivery_address, notes } = req.body;
    const tenantId = req.tenant.id, userId = req.user.userId;
    const productIds   = items.map(i => i.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await conn.execute(`SELECT id, name, price, stock_qty, reserved_qty FROM products WHERE id IN (${placeholders}) AND tenant_id = ? AND is_active = 1 FOR UPDATE`, [...productIds, tenantId]);
    if (products.length !== productIds.length) { await conn.rollback(); return fail(res, 'One or more products are unavailable', 400); }
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));
    let totalPrice = 0;
    for (const item of items) {
      const product = productMap[item.product_id];
      const avail   = product.stock_qty - product.reserved_qty;
      if (avail < item.quantity) { await conn.rollback(); return fail(res, `Only ${avail} unit(s) available for "${product.name}"`, 400); }
      totalPrice += parseFloat(product.price) * item.quantity;
    }
    const [orderResult] = await conn.execute(`INSERT INTO orders (tenant_id, user_id, total_price, status, delivery_address, notes) VALUES (?, ?, ?, 'pending', ?, ?)`, [tenantId, userId, totalPrice.toFixed(2), delivery_address, notes || null]);
    const orderId = orderResult.insertId;
    for (const item of items) {
      const product = productMap[item.product_id];
      await conn.execute('INSERT INTO order_items (order_id, product_id, quantity, price, product_name) VALUES (?, ?, ?, ?, ?)', [orderId, item.product_id, item.quantity, product.price, product.name]);
      await conn.execute('UPDATE products SET reserved_qty = reserved_qty + ? WHERE id = ? AND tenant_id = ? AND (stock_qty - reserved_qty) >= ?', [item.quantity, item.product_id, tenantId, item.quantity]);
    }
    await conn.commit();
    invalidateProductCache(tenantId);
    ok(res, { orderId, totalPrice: totalPrice.toFixed(2) }, 'Order created', 201);
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
};

exports.myOrders = async (req, res, next) => {
  try {
    const [orders] = await db.query(`SELECT o.id, o.total_price, o.status, o.created_at, o.razorpay_order_id, o.payment_id, JSON_ARRAYAGG(JSON_OBJECT('product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price)) AS items FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.tenant_id = ? AND o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC`, [req.tenant.id, req.user.userId]);
    const parsed = orders.map(o => ({ ...o, items: o.items ? (typeof o.items === 'string' ? JSON.parse(o.items) : o.items).filter(i => i !== null) : [] }));
    ok(res, { orders: parsed });
  } catch (err) { next(err); }
};

exports.listAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [req.tenant.id];
    let where = 'WHERE o.tenant_id = ?';
    if (status) { where += ' AND o.status = ?'; params.push(status); }
    const [orders] = await db.query(`SELECT o.id, o.total_price, o.status, o.created_at, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    ok(res, { orders });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { status } = req.body, orderId = req.params.id, tenantId = req.tenant.id;
    const [[order]] = await conn.execute('SELECT id, status FROM orders WHERE id = ? AND tenant_id = ? LIMIT 1', [orderId, tenantId]);
    if (!order) { await conn.rollback(); return fail(res, 'Order not found', 404); }
    const [result] = await conn.execute('UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?', [status, orderId, tenantId]);
    if (!result.affectedRows) { await conn.rollback(); return fail(res, 'Order not found', 404); }
    if (status === 'cancelled' && order.status === 'pending') {
      const [items] = await conn.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) await conn.execute('UPDATE products SET reserved_qty = GREATEST(0, reserved_qty - ?) WHERE id = ? AND tenant_id = ?', [item.quantity, item.product_id, tenantId]);
      invalidateProductCache(tenantId);
    }
    await conn.commit();
    ok(res, {}, 'Order status updated');
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
};
