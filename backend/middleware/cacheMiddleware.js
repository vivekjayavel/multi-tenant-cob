'use strict';
const { responseCache, buildKey } = require('../config/cache');

function httpCache({ maxAge = 60, sMaxAge = 300, staleWhile = 60 } = {}) {
  return (req, res, next) => {
    const isAuth = !!(req.headers.authorization || req.cookies?.token);
    if (isAuth) { res.setHeader('Cache-Control', 'private, no-cache, no-store'); return next(); }
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhile}`);
    res.setHeader('Vary', 'Accept-Encoding');
    next();
  };
}

function memCache(ttlMs) {
  return (req, res, next) => {
    if (req.method !== 'GET' || !req.tenant) return next();
    const sortedQuery = Object.keys(req.query).sort().map(k => `${k}=${req.query[k]}`).join('&');
    const cacheKey = buildKey(req.tenant.id, req.path, sortedQuery || null);
    const cached   = responseCache.get(cacheKey);
    if (cached) { res.setHeader('X-Cache', 'HIT'); res.setHeader('Content-Type', 'application/json'); return res.send(cached); }
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) responseCache.set(cacheKey, JSON.stringify(body), { ttl: ttlMs });
      return originalJson(body);
    };
    next();
  };
}

function noCache(req, res, next) {
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}

module.exports = { httpCache, memCache, noCache };
