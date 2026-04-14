'use strict';
const router        = require('express').Router();
const { body, param } = require('express-validator');
const ctrl          = require('../controllers/superadminController');
const auth          = require('../middleware/superadminMiddleware');
const validate      = require('../middleware/validate');
const { superadminLoginLimiter, superadminApiLimiter } = require('../middleware/rateLimiter');
const { cacheStats } = require('../config/cache');

router.post('/login', superadminLoginLimiter, [body('secret').notEmpty().isLength({ min: 8 })], validate, ctrl.login);
router.post('/logout', ctrl.logout);
router.use(auth);
router.use(superadminApiLimiter);
router.get('/tenants',              ctrl.listTenants);
router.get('/tenants/:id',          param('id').isInt({ min: 1 }), validate, ctrl.getTenant);
router.post('/tenants', [
  body('name').trim().notEmpty().isLength({ max: 150 }),
  body('domain').trim().notEmpty().matches(/^[a-z0-9.-]+\.[a-z]{2,}$/).custom(v => !v.startsWith('www.')),
  body('theme_color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('whatsapp_number').optional().matches(/^\d{10,15}$/),
  body('razorpay_key_id').optional().matches(/^rzp_(live|test)_[A-Za-z0-9]+$/),
  body('razorpay_key_secret').optional().isLength({ min: 8 }),
], validate, ctrl.createTenant);
router.put('/tenants/:id', [
  param('id').isInt({ min: 1 }),
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('domain').optional().trim().matches(/^[a-z0-9.-]+\.[a-z]{2,}$/).custom(v => !v.startsWith('www.')),
  body('theme_color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('whatsapp_number').optional().matches(/^\d{10,15}$/),
  body('razorpay_key_secret').optional().isLength({ min: 8 }),
  body('is_active').optional().isBoolean(),
], validate, ctrl.updateTenant);
router.delete('/tenants/:id', param('id').isInt({ min: 1 }), validate, ctrl.deactivateTenant);
router.get('/tenants/:id/checklist', param('id').isInt({ min: 1 }), validate, ctrl.getChecklist);
router.post('/tenants/:id/seed-admin', [
  param('id').isInt({ min: 1 }), body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
], validate, ctrl.seedAdminUser);
router.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({ success: true, uptime: process.uptime(), memory: { heapUsedMB: Math.round(mem.heapUsed/1024/1024), heapTotalMB: Math.round(mem.heapTotal/1024/1024) }, cache: cacheStats(), node: process.version });
});
module.exports = router;
