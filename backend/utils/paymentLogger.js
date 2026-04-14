'use strict';
const { paymentLogger } = require('../config/logger');
const ts = () => new Date().toISOString();
function logPaymentInitiated({ tenantId, orderId, razorpayOrderId, amount, currency, userId }) {
  paymentLogger.info('Payment initiated', { event: 'PAYMENT_INITIATED', tenantId, orderId, razorpayOrderId, amount, currency, userId, timestamp: ts() });
}
function logPaymentSuccess({ tenantId, orderId, razorpayPaymentId, razorpayOrderId, amount, userId, source }) {
  paymentLogger.info('Payment verified', { event: 'PAYMENT_SUCCESS', tenantId, orderId, razorpayPaymentId, razorpayOrderId, amount, userId, source, timestamp: ts() });
}
function logPaymentVerificationFailed({ tenantId, orderId, razorpayOrderId, razorpayPaymentId, reason, userId, securityEvent }) {
  paymentLogger.error('Payment verification failed', { event: 'PAYMENT_VERIFICATION_FAILED', tenantId, orderId, razorpayOrderId, razorpayPaymentId, reason, userId, securityEvent: !!securityEvent, timestamp: ts() });
}
function logPaymentError({ tenantId, orderId, error, userId }) {
  paymentLogger.error('Payment API error', { event: 'PAYMENT_API_ERROR', tenantId, orderId, userId, error: error instanceof Error ? error.message : String(error), timestamp: ts() });
}
module.exports = { logPaymentInitiated, logPaymentSuccess, logPaymentVerificationFailed, logPaymentError };
