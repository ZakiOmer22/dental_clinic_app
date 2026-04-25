const redis = require('redis');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
const initRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
    });

    redisClient.on('end', () => {
      console.log('Redis connection closed');
      isConnected = false;
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (err) {
    console.warn('⚠️ Redis not available, caching disabled:', err.message);
    isConnected = false;
    return null;
  }
};

/**
 * Get Redis client (with fallback)
 */
const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is available
 */
const isRedisAvailable = () => {
  return isConnected && redisClient !== null;
};

/**
 * Safe cache get
 */
const cacheGet = async (key) => {
  if (!isRedisAvailable()) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
};

/**
 * Safe cache set
 */
const cacheSet = async (key, value, ttl = 300) => {
  if (!isRedisAvailable()) return false;
  
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Cache set error:', err);
    return false;
  }
};

/**
 * Safe cache delete
 */
const cacheDel = async (pattern) => {
  if (!isRedisAvailable()) return false;
  
  try {
    if (pattern.includes('*')) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      await redisClient.del(pattern);
    }
    return true;
  } catch (err) {
    console.error('Cache delete error:', err);
    return false;
  }
};

/**
 * Cache middleware
 */
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (!isRedisAvailable() || req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.user?.clinicId || 'public'}:${req.originalUrl}`;
    
    try {
      const cached = await cacheGet(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          cacheSet(key, data, ttl).catch(() => {});
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (err) {
      next();
    }
  };
};

/**
 * Clear cache by pattern
 */
const clearCache = async (pattern) => {
  if (!isRedisAvailable()) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cleared ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (err) {
    console.error('Clear cache error:', err);
  }
};

/**
 * Clear clinic cache
 */
const clearClinicCache = async (clinicId) => {
  await clearCache(`cache:${clinicId}:*`);
};

module.exports = {
  initRedis,
  getRedisClient,
  isRedisAvailable,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheMiddleware,
  clearCache,
  clearClinicCache,
};