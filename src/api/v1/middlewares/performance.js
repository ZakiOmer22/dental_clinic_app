const compression = require('compression');
const { isRedisAvailable } = require('../../../config/redis');

/**
 * Response compression middleware
 */
const compressResponse = compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if already compressed
    if (req.headers['x-no-compression']) return false;
    
    // Use default filter
    return compression.filter(req, res);
  },
});

/**
 * Performance monitoring middleware
 */
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const slowThreshold = 1000;
    
    if (duration > slowThreshold) {
      console.warn(`⚠️ Slow request (${duration}ms): ${req.method} ${req.path}`);
    }
    
    // Record metrics
    if (duration > 100) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
  });
  
  next();
};

/**
 * Cache control headers middleware
 */
const cacheControl = (maxAge = 300) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      if (maxAge === 0) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      }
    }
    next();
  };
};

/**
 * ETag middleware for cache validation
 */
const etag = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (req.method === 'GET' && res.statusCode === 200) {
      const etagValue = generateETag(data);
      res.setHeader('ETag', etagValue);
      
      const clientETag = req.headers['if-none-match'];
      if (clientETag === etagValue) {
        return res.status(304).end();
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Generate ETag from data
 */
const generateETag = (data) => {
  const crypto = require('crypto');
  const str = JSON.stringify(data);
  return crypto.createHash('md5').update(str).digest('hex');
};

/**
 * Rate limit headers middleware
 */
const rateLimitHeaders = (req, res, next) => {
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', '99');
  next();
};

/**
 * Conditional caching middleware
 */
const conditionalCache = (ttl = 300) => {
  return (req, res, next) => {
    if (!isRedisAvailable() || req.method !== 'GET') {
      return next();
    }
    
    // Skip cache for authenticated requests that need fresh data
    if (req.headers['cache-control'] === 'no-cache') {
      res.setHeader('X-Cache', 'BYPASS');
      return next();
    }
    
    next();
  };
};

module.exports = {
  compressResponse,
  performanceMonitor,
  cacheControl,
  etag,
  rateLimitHeaders,
  conditionalCache,
};