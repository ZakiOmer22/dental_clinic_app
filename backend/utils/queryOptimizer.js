const pool = require('../db/pool');

/**
 * Query performance tracker
 */
class QueryOptimizer {
  constructor() {
    this.slowQueryThreshold = 1000; // 1 second
    this.queryStats = new Map();
  }

  /**
   * Execute query with performance tracking
   */
  async executeQuery(query, params = [], options = {}) {
    const startTime = Date.now();
    
    try {
      const result = await pool.query(query, params);
      const duration = Date.now() - startTime;
      
      this.trackQuery(query, duration, params.length);
      
      if (duration > this.slowQueryThreshold) {
        console.warn(`⚠️ Slow query (${duration}ms): ${query.substring(0, 200)}...`);
      }
      
      return result;
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`Query error (${duration}ms):`, err.message);
      throw err;
    }
  }

  /**
   * Track query statistics
   */
  trackQuery(query, duration, paramCount) {
    const normalized = this.normalizeQuery(query);
    
    if (!this.queryStats.has(normalized)) {
      this.queryStats.set(normalized, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0,
      });
    }
    
    const stats = this.queryStats.get(normalized);
    stats.count++;
    stats.totalTime += duration;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.avgTime = stats.totalTime / stats.count;
  }

  /**
   * Normalize query for grouping
   */
  normalizeQuery(query) {
    return query
      .replace(/'[^']*'/g, '?')
      .replace(/\$\d+/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get query statistics report
   */
  getStats(limit = 20) {
    const stats = Array.from(this.queryStats.entries())
      .map(([query, data]) => ({
        query: query.substring(0, 100),
        ...data,
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
    
    return {
      totalQueries: this.queryStats.size,
      slowQueries: stats.filter(s => s.avgTime > this.slowQueryThreshold).length,
      topQueries: stats,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.queryStats.clear();
  }

  /**
   * Build pagination query
   */
  buildPaginatedQuery(baseQuery, page = 1, limit = 20, sortBy = 'id', sortOrder = 'ASC') {
    const offset = (page - 1) * limit;
    const safeSortBy = this.sanitizeColumn(sortBy);
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    return {
      countQuery: `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`,
      dataQuery: `
        ${baseQuery}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `,
    };
  }

  /**
   * Sanitize column name
   */
  sanitizeColumn(column) {
    // Only allow alphanumeric and underscore
    return column.replace(/[^a-zA-Z0-9_]/g, '');
  }

  /**
   * Build search condition
   */
  buildSearchCondition(fields, searchTerm) {
    if (!searchTerm) return { clause: '', params: [] };
    
    const conditions = fields.map(field => `${field} ILIKE $1`);
    return {
      clause: `(${conditions.join(' OR ')})`,
      params: [`%${searchTerm}%`],
    };
  }

  /**
   * Build date range condition
   */
  buildDateRangeCondition(column, fromDate, toDate, paramOffset = 1) {
    const conditions = [];
    const params = [];
    
    if (fromDate) {
      conditions.push(`${column} >= $${paramOffset++}`);
      params.push(fromDate);
    }
    
    if (toDate) {
      conditions.push(`${column} <= $${paramOffset++}`);
      params.push(toDate + ' 23:59:59');
    }
    
    return {
      clause: conditions.length ? conditions.join(' AND ') : '',
      params,
      nextParamIndex: paramOffset,
    };
  }
}

module.exports = new QueryOptimizer();