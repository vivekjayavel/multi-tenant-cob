'use strict';
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const db       = require('../config/db');
const { ok, fail }         = require('../utils/responseUtils');
const { logger }           = require('../config/logger');
const { safeDecrypt }      = require('../utils/encryption');
const { logPaymentInitiated, logPaymentSuccess, logPaymentVerificationFailed, logPaymentError } = require('../utils/paymentLogger');
const { sendOrderConfirmation, sendNewOrderAlert } = require('../services/emailService');

function getRazorpay(tenant) {
  if (!tenant.razorpay_key_id || !tenant.razorpay_key_secret)
    throw Object.assign(new Error('Payment not configured for this store'), { status: 503 });
  let secret;
  try { secret = safeDecrypt(tenant.razorpay_key_secret); }
  catch (err) { logger.error('Failed to decrypt Razorpay secret', { tenantId: tenant.id, error: err.message }); throw Object.assign(new Error('Payment configuration error'), { status: 503 }); }
  return new Razorpay({ key_id: tenant.razorpay_key_id, key_secret: secret });
}

async function fulfillOrder(orderId, tenantId, razorpayPaymentId, razorpaySignature = null) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(`UPDATE orders SET status = 'paid', payment_id = ?, payment_signature = ? WHERE id = ? AND tenant_id = ? AND status = 'pending'`, [razorpayPaymentId, razorpaySignature, orderId, tenantId]);
    if (result.affectedRows === 0) { await conn.rollback(); return false; }
    const [items] = await conn.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
    for (const item of items) await conn.execute('UPDATE products SET stock_qty = stock_qty - ?, reserved_qty = reserved_qty - ? WHERE id = ? AND tenant_id = ? AND stock_qty >= ?', [item.quantity, item.quantity, item.product_id, tenantId, item.quantity]);
    await conn.commit();
  } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }

  const [[order]] = await db.query(`SELECT o.id, o.total_price, o.status, o.delivery_address, o.notes, o.created_at, u.name AS user_name, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ? AND o.tenant_id = ? LIMIT 1`, [orderId, tenantId]);
  const [emailItems] = await db.query('SELECT product_name, quantity, price FROM order_items WHERE order_id = ?', [orderId]);
  const [[tenant]] = await db.query('SELECT id, name, domain, logo_url, theme_color, whatsapp_number FROM tenants WHERE id = ? LIMIT 1', [tenantId]);
  const user = { name: order.user_name, email: order.user_email };
  const customer = { name: order.user_name, email: order.user_email, phone: null };
  Promise.all([
    sendOrderConfirmation({ tenant, order, items: emailItems, user }),
    sendNewOrderAlert({ db, tenant, order, items: emailItems, customer }),
  ]).catch(err => logger.error('Post-fulfillment email error', { tenantId, orderId, error: err.message }));
  return true;
}

exports.createRazorpayOrder = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { orderId } = req.body;
    const userId = req.user?.userId || null;
    const [rows] = await conn.execute(
      userId
        ? 'SELECT id, total_price, status, razorpay_order_id FROM orders WHERE id = ? AND tenant_id = ? AND user_id = ? LIMIT 1 FOR UPDATE'
        : 'SELECT id, total_price, status, razorpay_order_id FROM orders WHERE id = ? AND tenant_id = ? LIMIT 1 FOR UPDATE',
      userId ? [orderId, req.tenant.id, userId] : [orderId, req.tenant.id]
    );
    if (!rows.length) { await conn.rollback(); return fail(res, 'Order not found', 404); }
    const order = rows[0];
    if (['paid','delivered','cancelled','refunded'].includes(order.status)) { await conn.rollback(); return fail(res, `Order is already ${order.status}`, 409); }
    if (order.razorpay_order_id) { await conn.commit(); return ok(res, { razorpay_order_id: order.razorpay_order_id, amount: Math.round(parseFloat(order.total_price) * 100), currency: 'INR', key_id: req.tenant.razorpay_key_id }); }
    const rzp = getRazorpay(req.tenant);
    const amount = Math.round(parseFloat(order.total_price) * 100);
    const rzpOrder = await rzp.orders.create({ amount, currency: 'INR', receipt: `order_${orderId}`, notes: { tenant_id: String(req.tenant.id), order_id: String(orderId) } });
    await conn.execute('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [rzpOrder.id, orderId]);
    await conn.commit();
    logPaymentInitiated({ tenantId: req.tenant.id, orderId, razorpayOrderId: rzpOrder.id, amount, currency: 'INR', userId: req.user?.userId || null });
    ok(res, { razorpay_order_id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, key_id: req.tenant.razorpay_key_id });
  } catch (err) { await conn.rollback(); logPaymentError({ tenantId: req.tenant?.id, orderId: req.body?.orderId, userId: req.user?.userId, error: err }); next(err); } finally { conn.release(); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    let keySecret;
    try { keySecret = safeDecrypt(req.tenant.razorpay_key_secret); } catch { return fail(res, 'Payment configuration error', 503); }
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    if (expected !== razorpay_signature) { logPaymentVerificationFailed({ tenantId: req.tenant.id, orderId, razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, reason: 'HMAC mismatch', userId: req.user?.userId || null }); return fail(res, 'Payment verification failed', 400); }
    const userId = req.user?.userId || null;
    const [[dbOrder]] = await db.query(
      userId
        ? 'SELECT id, total_price, status, razorpay_order_id FROM orders WHERE id = ? AND tenant_id = ? AND user_id = ? LIMIT 1'
        : 'SELECT id, total_price, status, razorpay_order_id FROM orders WHERE id = ? AND tenant_id = ? LIMIT 1',
      userId ? [orderId, req.tenant.id, userId] : [orderId, req.tenant.id]
    );
    if (!dbOrder) return fail(res, 'Order not found', 404);
    if (dbOrder.status === 'paid') return ok(res, { paymentId: razorpay_payment_id }, 'Payment successful');
    if (dbOrder.razorpay_order_id !== razorpay_order_id) { logPaymentVerificationFailed({ tenantId: req.tenant.id, orderId, razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, reason: 'Order ID mismatch', userId: req.user.userId, securityEvent: true }); return fail(res, 'Payment verification failed', 400); }
    let rzpPayment;
    try { const rzp = getRazorpay(req.tenant); rzpPayment = await rzp.payments.fetch(razorpay_payment_id); } catch (err) { logger.error('Razorpay payment fetch failed', { tenantId: req.tenant.id, orderId, error: err.message }); }
    if (rzpPayment) {
      const expectedPaise = Math.round(parseFloat(dbOrder.total_price) * 100);
      if (Math.abs(rzpPayment.amount - expectedPaise) > 1) { logPaymentVerificationFailed({ tenantId: req.tenant.id, orderId, reason: `Amount mismatch: expected ${expectedPaise}, got ${rzpPayment.amount}`, userId: req.user.userId, securityEvent: true }); return fail(res, 'Payment amount does not match order total', 400); }
    }
    const fulfilled = await fulfillOrder(orderId, req.tenant.id, razorpay_payment_id, razorpay_signature);
    if (fulfilled) logPaymentSuccess({ tenantId: req.tenant.id, orderId, razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id, amount: rzpPayment?.amount, userId: req.user.userId, source: 'browser' });
    ok(res, { paymentId: razorpay_payment_id }, 'Payment verified successfully');
  } catch (err) { logPaymentError({ tenantId: req.tenant?.id, orderId: req.body?.orderId, userId: req.user?.userId, error: err }); next(err); }
};

exports.handleWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(200).json({ success: true, reason: 'webhook_not_configured' });
  const receivedSig = req.headers['x-razorpay-signature'];
  if (!receivedSig) return res.status(400).json({ success: false, reason: 'missing_signature' });
  const expectedSig = crypto.createHmac('sha256', webhookSecret).update(req.body).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expectedSig, 'hex'), Buffer.from(receivedSig, 'hex'))) { logger.warn('Webhook signature mismatch', { ip: req.ip }); return res.status(400).json({ success: false, reason: 'invalid_signature' }); }
  let event;
  try { event = JSON.parse(req.body.toString()); } catch { return res.status(400).json({ success: false, reason: 'invalid_json' }); }
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity, notes = payment?.notes || {};
    const tenantId = parseInt(notes.tenant_id), orderId = parseInt(notes.order_id), razorpayPayId = payment?.id;
    if (!tenantId || !orderId || !razorpayPayId) return res.status(200).json({ success: true, reason: 'missing_fields_acked' });
    try {
      const [[orderCheck]] = await db.query('SELECT id, status FROM orders WHERE id = ? AND tenant_id = ? LIMIT 1', [orderId, tenantId]);
      if (!orderCheck) return res.status(200).json({ success: true, reason: 'order_not_found_acked' });
      const fulfilled = await fulfillOrder(orderId, tenantId, razorpayPayId, null);
      if (!fulfilled) {
        const [[orderState]] = await db.query('SELECT status FROM orders WHERE id = ? LIMIT 1', [orderId]);
        if (orderState?.status === 'cancelled') logger.error('MANUAL ACTION REQUIRED: payment captured for cancelled order', { orderId, tenantId, razorpayPayId, action: 'Issue refund via Razorpay dashboard' });
      }
      logPaymentSuccess({ tenantId, orderId, razorpayPaymentId: razorpayPayId, razorpayOrderId: payment?.order_id, amount: payment?.amount, userId: null, source: 'webhook' });
    } catch (err) { logger.error('Webhook fulfillment error', { orderId, tenantId, error: err.message }); return res.status(500).json({ success: false }); }
  }
  return res.status(200).json({ success: true });
};

module.exports = { ...module.exports, fulfillOrder };
