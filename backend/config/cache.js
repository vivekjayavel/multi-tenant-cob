'use strict';
const { LRUCache } = require('lru-cache');
const { logger }   = require('./logger');

const tenantCache   = new LRUCache({ max: 100, ttl: 10 * 60 * 1000, allowStale: false, updateAgeOnGet: false });
const productCache  = new LRUCache({ max: 500, ttl: 5 * 60 * 1000,  allowStale: false, updateAgeOnGet: true  });
const responseCache = new LRUCache({ max: 200, ttl: 2 * 60 * 1000,  allowStale: false, updateAgeOnGet: false });

function buildKey(tenantId, ...parts) { return `${tenantId}:${parts.filter(Boolean).join(':')}`; }

function invalidateProductCache(tenantId) {
  const prefix = `${tenantId}:`;
  let count = 0;
  // Clear productCache (SSR prefetch cache)
  for (const key of productCache.keys()) {
    if (key.startsWith(prefix)) { productCache.delete(key); count++; }
  }
  // Also clear responseCache (API response cache used by memCache middleware)
  // Without this, admin /api/products returns stale responses without new images
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) { responseCache.delete(key); count++; }
  }
  if (count > 0) logger.info('Product cache invalidated', { tenantId, entriesRemoved: count });
}

function cacheStats() {
  return {
    tenant:   { size: tenantCache.size,   max: tenantCache.max   },
    product:  { size: productCache.size,  max: productCache.max  },
    response: { size: responseCache.size, max: responseCache.max },
  };
}

module.exports = { tenantCache, productCache, responseCache, buildKey, invalidateProductCache, cacheStats };
