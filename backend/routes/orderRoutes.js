'use strict';
const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/orderController');
const { authMiddleware, adminOnly, optionalAuth } = require('../middleware/authMiddleware');
const { orderLimiter }              = require('../middleware/rateLimiter');
const validate                      = require('../middleware/validate');

router.post('/', optionalAuth, orderLimiter, [
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1 }),
  body('delivery_address').trim().notEmpty(),
], validate, ctrl.create);
router.get('/my',  authMiddleware, ctrl.myOrders);
router.get('/',    authMiddleware, adminOnly, ctrl.listAll);
router.patch('/:id/status', authMiddleware, adminOnly,
  body('status').isIn(['processing','shipped','delivered','cancelled','refunded','cod_confirmed']), validate, ctrl.updateStatus);
module.exports = router;
