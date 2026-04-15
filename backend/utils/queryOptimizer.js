'use strict';
const db = require('../config/db');
const { logger } = require('../config/logger');

async function getProductsOptimized(tenantId, { category, search, page = 1, limit = 12 } = {}) {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [tenantId];
  let where = 'WHERE p.tenant_id = ? AND p.is_active = 1';
  if (category) { where += ' AND p.category = ?'; params.push(category); }
  if (search)   { where += ' AND p.name LIKE ?';  params.push(`%${search}%`); }

  const [products, countResult] = await Promise.all([
    db.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.category, p.slug, p.stock_qty, p.reserved_qty
       FROM products p ${where} ORDER BY p.created_at DESC LIMIT ${parseInt(limit,10)||12} OFFSET ${parseInt(offset,10)||0}`,
      params
    ),
    db.query(`SELECT COUNT(*) AS total FROM products p ${where}`, params),
  ]);
  return { products: products[0], total: parseInt(countResult[0][0].total) };
}

async function reconcilePendingOrders(maxAgeMinutes = 60) {
  const [pendingOrders] = await db.query(
    `SELECT id, tenant_id, total_price, razorpay_order_id FROM orders
     WHERE status = 'pending' AND razorpay_order_id IS NOT NULL
       AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL ? MINUTE) AND DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
    [maxAgeMinutes]
  );
  if (!pendingOrders.length) { logger.info('Reconciler: no pending orders'); return { checked: 0, reconciled: 0 }; }
  let reconciled = 0;
  for (const order of pendingOrders) {
    try {
      const Razorpay = require('razorpay');
      const { safeDecrypt } = require('./encryption');
      const [[tenant]] = await db.query('SELECT razorpay_key_id, razorpay_key_secret FROM tenants WHERE id = ? LIMIT 1', [order.tenant_id]);
      if (!tenant?.razorpay_key_id) continue;
      const secret = safeDecrypt(tenant.razorpay_key_secret);
      const rzp    = new Razorpay({ key_id: tenant.razorpay_key_id, key_secret: secret });
      const payments = await rzp.orders.fetchPayments(order.razorpay_order_id);
      const captured = payments.items?.find(p => p.status === 'captured');
      if (captured) {
        const { fulfillOrder } = require('../controllers/paymentController');
        const fulfilled = await fulfillOrder(order.id, order.tenant_id, captured.id, null);
        if (fulfilled) reconciled++;
      }
    } catch (err) { logger.error('Reconciler error', { orderId: order.id, error: err.message }); }
  }
  logger.info('Reconciler complete', { checked: pendingOrders.length, reconciled });
  return { checked: pendingOrders.length, reconciled };
}

module.exports = { getProductsOptimized, reconcilePendingOrders };
