'use strict';
const Razorpay   = require('razorpay');
const { safeDecrypt } = require('../utils/encryption');
const { logger }      = require('../config/logger');

function createRazorpayInstance(tenant) {
  if (!tenant.razorpay_key_id || !tenant.razorpay_key_secret)
    throw Object.assign(new Error('Payment not configured for this store'), { status: 503 });
  let secret;
  try { secret = safeDecrypt(tenant.razorpay_key_secret); }
  catch (err) { logger.error('Failed to decrypt Razorpay secret', { tenantId: tenant.id, error: err.message }); throw Object.assign(new Error('Payment configuration error'), { status: 503 }); }
  return new Razorpay({ key_id: tenant.razorpay_key_id, key_secret: secret });
}

async function createOrder(tenant, { amount, currency = 'INR', receipt, notes }) {
  const rzp = createRazorpayInstance(tenant);
  return rzp.orders.create({ amount, currency, receipt, notes });
}

async function fetchPayment(tenant, paymentId) {
  return createRazorpayInstance(tenant).payments.fetch(paymentId);
}

module.exports = { createRazorpayInstance, createOrder, fetchPayment };
