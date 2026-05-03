'use strict';
const router   = require('express').Router();
const { body } = require('express-validator');
const express  = require('express');
const ctrl     = require('../controllers/paymentController');
const { authMiddleware, optionalAuth }  = require('../middleware/authMiddleware');
const { paymentLimiter }  = require('../middleware/rateLimiter');
const validate            = require('../middleware/validate');

router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);
router.post('/create-order', optionalAuth, paymentLimiter, body('orderId').isInt({ min: 1 }), validate, ctrl.createRazorpayOrder);
router.post('/verify', optionalAuth, paymentLimiter, [
  body('razorpay_order_id').notEmpty(), body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(), body('orderId').isInt({ min: 1 }),
], validate, ctrl.verifyPayment);
module.exports = router;
