const { cacheGet, cacheSet, cacheDel, clearClinicCache } = require('../config/redis');

// Cache TTL configurations (in seconds)
const TTL = {
  PATIENT_LIST: 300,        // 5 minutes
  PATIENT_DETAIL: 600,      // 10 minutes
  TREATMENT_LIST: 1800,     // 30 minutes
  APPOINTMENT_LIST: 120,    // 2 minutes
  INVENTORY_LIST: 300,      // 5 minutes
  LAB_LIST: 600,            // 10 minutes
  DASHBOARD_STATS: 300,     // 5 minutes
  USER_PERMISSIONS: 3600,   // 1 hour
};

class CacheService {
  /**
   * Generate cache key
   */
  generateKey(clinicId, resource, identifier = '') {
    return `cache:${clinicId}:${resource}${identifier ? ':' + identifier : ''}`;
  }

  /**
   * Get cached data
   */
  async get(clinicId, resource, identifier = '') {
    const key = this.generateKey(clinicId, resource, identifier);
    return await cacheGet(key);
  }

  /**
   * Set cached data
   */
  async set(clinicId, resource, data, ttl, identifier = '') {
    const key = this.generateKey(clinicId, resource, identifier);
    return await cacheSet(key, data, ttl);
  }

  /**
   * Delete cached data
   */
  async del(clinicId, resource, identifier = '') {
    const key = this.generateKey(clinicId, resource, identifier);
    return await cacheDel(key);
  }

  /**
   * Invalidate all cache for a clinic
   */
  async invalidateClinic(clinicId) {
    return await clearClinicCache(clinicId);
  }

  /**
   * Invalidate resource cache
   */
  async invalidateResource(clinicId, resource) {
    const pattern = this.generateKey(clinicId, resource) + '*';
    return await cacheDel(pattern);
  }

  /**
   * Wrap function with cache
   */
  async wrap(clinicId, resource, ttl, fn, identifier = '') {
    const cached = await this.get(clinicId, resource, identifier);
    if (cached !== null) {
      return cached;
    }

    const data = await fn();
    await this.set(clinicId, resource, data, ttl, identifier);
    return data;
  }
}

module.exports = {
  CacheService: new CacheService(),
  TTL,
};