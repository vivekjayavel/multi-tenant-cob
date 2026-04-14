'use strict';
const router   = require('express').Router();
const { body } = require('express-validator');
const authController    = require('../controllers/authController');
const sessionController = require('../controllers/sessionController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { authLimiter }               = require('../middleware/rateLimiter');
const validate                      = require('../middleware/validate');

router.post('/register', authLimiter, [
  body('name').trim().notEmpty(), body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
], validate, authController.register);
router.post('/login',  authLimiter, [body('email').isEmail().normalizeEmail(), body('password').notEmpty()], validate, authController.login);
router.post('/logout', authController.logout);
router.get('/me',      authMiddleware, authController.me);
router.post('/logout-all',     authMiddleware, sessionController.logoutAll);
router.get('/session-info',    authMiddleware, sessionController.sessionInfo);
router.post('/revoke-user-sessions', authMiddleware, adminOnly, body('userId').isInt({ min: 1 }), validate, sessionController.revokeUserSessions);
module.exports = router;
