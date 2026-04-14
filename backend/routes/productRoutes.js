'use strict';
const router          = require('express').Router();
const { body, param } = require('express-validator');
const ctrl            = require('../controllers/productController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const validate        = require('../middleware/validate');
const { httpCache, memCache } = require('../middleware/cacheMiddleware');

router.get('/', httpCache({ maxAge: 60, sMaxAge: 300, staleWhile: 60 }), memCache(3 * 60 * 1000), ctrl.list);
router.get('/:slug', httpCache({ maxAge: 120, sMaxAge: 600, staleWhile: 120 }), memCache(5 * 60 * 1000), param('slug').trim().notEmpty(), validate, ctrl.getBySlug);
router.post('/',    authMiddleware, adminOnly, [body('name').trim().notEmpty(), body('price').isFloat({ min: 0 }), body('category').trim().notEmpty()], validate, ctrl.create);
router.put('/:id',  authMiddleware, adminOnly, param('id').isInt({ min: 1 }), validate, ctrl.update);
router.delete('/:id', authMiddleware, adminOnly, param('id').isInt({ min: 1 }), validate, ctrl.remove);
module.exports = router;
