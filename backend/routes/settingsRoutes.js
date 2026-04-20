'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/settingsController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { uploadLimiter }             = require('../middleware/rateLimiter');
const { upload, validateMagicBytes } = require('../middleware/uploadMiddleware');

router.get('/',    authMiddleware, adminOnly, ctrl.getSettings);
router.put('/',    authMiddleware, adminOnly, ctrl.updateSettings);
router.post('/hero-image', authMiddleware, adminOnly, uploadLimiter,
  (req, res, next) => { req.uploadType = 'hero'; next(); },
  upload.single('image'), validateMagicBytes, ctrl.uploadHeroImage);
router.post('/banner-image', authMiddleware, adminOnly, uploadLimiter,
  (req, res, next) => { req.uploadType = 'banner'; next(); },
  upload.single('image'), validateMagicBytes, ctrl.uploadBannerImage);

module.exports = router;

router.put('/branding', authMiddleware, adminOnly, require('../controllers/brandingController').updateBranding);
