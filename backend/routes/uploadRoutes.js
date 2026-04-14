'use strict';
const router = require('express').Router();
const { authMiddleware, adminOnly }  = require('../middleware/authMiddleware');
const { upload, validateMagicBytes } = require('../middleware/uploadMiddleware');
const { uploadLimiter }              = require('../middleware/rateLimiter');
const uploadController               = require('../controllers/uploadController');

router.post('/product-image', authMiddleware, adminOnly, uploadLimiter,
  (req, res, next) => { req.uploadType = 'products'; next(); },
  upload.single('image'), validateMagicBytes, uploadController.productImage);
router.post('/logo', authMiddleware, adminOnly, uploadLimiter,
  (req, res, next) => { req.uploadType = 'logo'; next(); },
  upload.single('image'), validateMagicBytes, uploadController.logo);
module.exports = router;
