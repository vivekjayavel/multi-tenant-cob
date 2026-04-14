#!/usr/bin/env node
'use strict';
require('dotenv').config();
const db         = require('../backend/config/db');
const { logger } = require('../backend/config/logger');
const { invalidateProductCache } = require('../backend/config/cache');
const TIMEOUT = parseInt(process.env.ABANDON_TIMEOUT_MINUTES) || 60;

async function releaseAbandonedOrders() {
  const [orders] = await db.execute(`SELECT id, tenant_id FROM orders WHERE status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE) AND razorpay_order_id IS NOT NULL`, [TIMEOUT]);
  if (!orders.length) { logger.info('Abandoned cleanup: nothing to process'); return { processed: 0, failed: 0 }; }
  logger.info(`Abandoned cleanup: found ${orders.length} orders`);
  let processed = 0, failed = 0;
  for (const order of orders) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [items] = await conn.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order.id]);
      const [result] = await conn.execute("UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'", [order.id]);
      if (result.affectedRows === 0) { await conn.rollback(); continue; }
      for (const item of items) await conn.execute('UPDATE products SET reserved_qty = GREATEST(0, reserved_qty - ?) WHERE id = ? AND tenant_id = ?', [item.quantity, item.product_id, order.tenant_id]);
      await conn.commit();
      invalidateProductCache(order.tenant_id);
      processed++;
    } catch (err) { await conn.rollback(); failed++; logger.error('Failed to cancel abandoned order', { orderId: order.id, error: err.message }); } finally { conn.release(); }
  }
  logger.info('Abandoned cleanup complete', { processed, failed });
  return { processed, failed };
}

if (require.main === module) {
  releaseAbandonedOrders().then(({ processed, failed }) => { console.log(`✅ ${processed} cancelled, ${failed} failed`); process.exit(failed > 0 ? 1 : 0); }).catch(err => { console.error('❌', err.message); process.exit(1); });
}
module.exports = { releaseAbandonedOrders };
