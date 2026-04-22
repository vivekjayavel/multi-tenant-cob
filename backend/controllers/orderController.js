'use strict';
const db     = require('../config/db');
const { ok, fail }               = require('../utils/responseUtils');
const { invalidateProductCache } = require('../config/cache');
const { logger }                 = require('../config/logger');

// ── Create order ───────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { items, delivery_address, notes, payment_method = 'online' } = req.body;
    const tenantId = req.tenant.id;
    const userId   = req.user.userId;

    // Validate payment method
    if (!['online', 'cod'].includes(payment_method))
      return fail(res, 'Invalid payment method', 400);

    // Fetch all products at once with lock
    const productIds   = items.map(i => i.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const [products]   = await conn.execute(
      `SELECT id, name, price, stock_qty, reserved_qty FROM products
       WHERE id IN (${placeholders}) AND tenant_id = ? AND is_active = 1 FOR UPDATE`,
      [...productIds, tenantId]
    );

    if (products.length !== productIds.length) {
      await conn.rollback();
      return fail(res, 'One or more products are unavailable', 400);
    }

    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    // Check stock and compute total
    let totalPrice = 0;
    for (const item of items) {
      const product = productMap[item.product_id];
      const avail   = product.stock_qty - product.reserved_qty;
      if (avail < item.quantity) {
        await conn.rollback();
        return fail(res, `Only ${avail} unit(s) available for "${product.name}"`, 400);
      }
      totalPrice += parseFloat(product.price) * item.quantity;
    }

    // Insert order — COD starts as 'cod_pending', online as 'pending'
    const initialStatus = payment_method === 'cod' ? 'cod_pending' : 'pending';
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (tenant_id, user_id, total_price, status, delivery_address, notes, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, userId, totalPrice.toFixed(2), initialStatus, delivery_address, notes || null, payment_method]
    );
    const orderId = orderResult.insertId;

    // Insert order items with customization
    for (const item of items) {
      const product           = productMap[item.product_id];
      const custDetails       = item.customization
        ? JSON.stringify(item.customization)
        : null;

      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price, product_name, customization_details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, product.price, product.name, custDetails]
      );

      // Use LEAST() to ensure reserved_qty never exceeds stock_qty (satisfies chk_reserved_lte_stock)
      const result = await conn.execute(
        `UPDATE products
         SET reserved_qty = LEAST(stock_qty, reserved_qty + ?)
         WHERE id = ? AND tenant_id = ?`,
        [item.quantity, item.product_id, tenantId]
      );
    }

    await conn.commit();
    invalidateProductCache(tenantId);

    logger.info('Order created', { tenantId, orderId, payment_method, total: totalPrice.toFixed(2) });
    ok(res, { orderId, totalPrice: totalPrice.toFixed(2), payment_method }, 'Order created', 201);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// ── My orders ─────────────────────────────────────────────────────────────
exports.myOrders = async (req, res, next) => {
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.total_price, o.status, o.payment_method, o.created_at,
              o.razorpay_order_id, o.payment_id,
              JSON_ARRAYAGG(JSON_OBJECT(
                'product_name', oi.product_name,
                'quantity',     oi.quantity,
                'price',        oi.price,
                'customization', oi.customization_details
              )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.tenant_id = ? AND o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.tenant.id, req.user.userId]
    );
    const parsed = orders.map(o => ({
      ...o,
      items: o.items
        ? (typeof o.items === 'string' ? JSON.parse(o.items) : o.items)
            .filter(i => i !== null)
            .map(i => ({
              ...i,
              customization: i.customization
                ? (typeof i.customization === 'string' ? JSON.parse(i.customization) : i.customization)
                : null,
            }))
        : [],
    }));
    ok(res, { orders: parsed });
  } catch (err) { next(err); }
};

// ── List all orders (admin) ───────────────────────────────────────────────
exports.listAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset     = (parseInt(page) - 1) * parseInt(limit);
    const params     = [req.tenant.id];
    let where        = 'WHERE o.tenant_id = ?';
    if (status) { where += ' AND o.status = ?'; params.push(status); }

    const [orders] = await db.query(
      `SELECT o.id, o.total_price, o.status, o.payment_method, o.delivery_address,
              o.notes, o.created_at,
              u.name AS customer_name, u.email AS customer_email,
              JSON_ARRAYAGG(JSON_OBJECT(
                'product_name',         oi.product_name,
                'quantity',             oi.quantity,
                'price',                oi.price,
                'customization_details', oi.customization_details
              )) AS items
       FROM orders o
       JOIN users u       ON u.id  = o.user_id
       JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const parsed = orders.map(o => ({
      ...o,
      items: o.items
        ? (typeof o.items === 'string' ? JSON.parse(o.items) : o.items)
            .filter(i => i !== null)
            .map(i => ({
              ...i,
              customization_details: i.customization_details
                ? (typeof i.customization_details === 'string'
                    ? JSON.parse(i.customization_details)
                    : i.customization_details)
                : null,
            }))
        : [],
    }));

    ok(res, { orders: parsed });
  } catch (err) { next(err); }
};

// ── Update order status ───────────────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { status } = req.body;
    const orderId    = req.params.id;
    const tenantId   = req.tenant.id;

    const [[order]] = await conn.execute(
      'SELECT id, status, payment_method FROM orders WHERE id = ? AND tenant_id = ? LIMIT 1',
      [orderId, tenantId]
    );
    if (!order) { await conn.rollback(); return fail(res, 'Order not found', 404); }

    const [result] = await conn.execute(
      'UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?',
      [status, orderId, tenantId]
    );
    if (!result.affectedRows) { await conn.rollback(); return fail(res, 'Order not found', 404); }

    // Release reserved stock on cancellation
    if (status === 'cancelled' && ['pending','cod_pending'].includes(order.status)) {
      const [items] = await conn.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );
      for (const item of items) {
        await conn.execute(
          'UPDATE products SET reserved_qty = GREATEST(0, reserved_qty - ?) WHERE id = ? AND tenant_id = ?',
          [item.quantity, item.product_id, tenantId]
        );
      }
      invalidateProductCache(tenantId);
    }

    await conn.commit();
    ok(res, {}, 'Order status updated');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
