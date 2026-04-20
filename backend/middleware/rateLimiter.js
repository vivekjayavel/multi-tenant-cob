'use strict';
const rateLimit = require('express-rate-limit');

function makeLimit({ windowMs, max, message, skipSuccessful = false }) {
  return rateLimit({
    windowMs, max, standardHeaders: true, legacyHeaders: false,
    handler(req, res) { res.status(429).json({ success: false, message, retryAfter: Math.ceil(req.rateLimit.resetTime / 1000) }); },
    keyGenerator(req) { return `${req.tenant?.id ?? req.ip ?? 'global'}:${req.ip ?? 'unknown'}`; },
    skipSuccessfulRequests: skipSuccessful,
  });
}

const authLimiter             = makeLimit({ windowMs: 15 * 60 * 1000, max: 10,  message: 'Too many login attempts. Wait 15 minutes.', skipSuccessful: true });
const orderLimiter            = makeLimit({ windowMs: 60 * 60 * 1000, max: 20,  message: 'Too many orders. Please try again later.' });
const uploadLimiter           = makeLimit({ windowMs: 60 * 60 * 1000, max: 30,  message: 'Too many uploads. Please wait.' });
const generalApiLimiter       = makeLimit({
  windowMs: 60 * 1000,
  // Higher limit in dev (HMR causes many requests), strict in prod
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  message: 'Too many requests. Please slow down.',
});
const paymentLimiter          = makeLimit({ windowMs: 60 * 60 * 1000, max: 30,  message: 'Too many payment requests. Please wait.' });
const superadminLoginLimiter  = makeLimit({ windowMs: 30 * 60 * 1000, max: 5,   message: 'Too many superadmin login attempts. Access locked for 30 minutes.', skipSuccessful: true });
const superadminApiLimiter    = makeLimit({ windowMs: 60 * 1000,      max: 60,  message: 'Too many superadmin API requests.' });

module.exports = { authLimiter, orderLimiter, uploadLimiter, generalApiLimiter, paymentLimiter, superadminLoginLimiter, superadminApiLimiter };
