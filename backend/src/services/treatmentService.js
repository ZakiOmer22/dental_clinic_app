const pool = require('../db/pool');
const { NotFoundError, ValidationError, ConflictError } = require('../../utils/errors');

class TreatmentService {
  /**
   * Get all treatments
   */
  async getTreatments(clinicId, filters = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      category,
      isActive,
      minPrice,
      maxPrice,
      requiresLab,
      sortBy = 'category',
      sortOrder = 'ASC',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [clinicId];
    let paramIndex = 2;

    let whereClause = 'WHERE t.clinic_id = $1';
    
    if (search) {
      whereClause += ` AND (
        t.name ILIKE $${paramIndex} OR 
        t.code ILIKE $${paramIndex} OR 
        t.description ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      whereClause += ` AND t.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereClause += ` AND t.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    if (minPrice !== undefined) {
      whereClause += ` AND t.price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      whereClause += ` AND t.price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    if (requiresLab !== undefined) {
      whereClause += ` AND t.requires_lab = $${paramIndex}`;
      params.push(requiresLab);
      paramIndex++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM treatments t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const sortColumn = {
      name: 't.name',
      category: 't.category',
      price: 't.price',
      durationMinutes: 't.duration_minutes',
      createdAt: 't.created_at',
    }[sortBy] || 't.category, t.name';

    const orderBy = sortBy === 'category' ? 't.category ASC, t.name ASC' : `${sortColumn} ${sortOrder}`;

    const dataResult = await pool.query(
      `SELECT 
        t.id, t.clinic_id, t.name, t.code, t.category,
        t.description, t.duration_minutes, t.price, t.cost,
        t.tooth_surface, t.requires_lab, t.insurance_code,
        t.notes, t.is_active, t.color_code, t.icon,
        t.created_at, t.updated_at, t.created_by, t.updated_by,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name,
        (SELECT COUNT(*) FROM appointment_treatments WHERE treatment_id = t.id) as usage_count
      FROM treatments t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users updater ON t.updated_by = updater.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      treatments: dataResult.rows.map(this.formatTreatment),
      pagination: { page, limit, total },
    };
  }

  /**
   * Get single treatment
   */
  async getTreatmentById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        t.id, t.clinic_id, t.name, t.code, t.category,
        t.description, t.duration_minutes, t.price, t.cost,
        t.tooth_surface, t.requires_lab, t.insurance_code,
        t.notes, t.is_active, t.color_code, t.icon,
        t.created_at, t.updated_at, t.created_by, t.updated_by,
        creator.full_name as created_by_name,
        updater.full_name as updated_by_name
      FROM treatments t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users updater ON t.updated_by = updater.id
      WHERE t.id = $1 AND t.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) {
      throw new NotFoundError('Treatment');
    }

    return this.formatTreatment(rows[0]);
  }

  /**
   * Check for duplicate treatment code
   */
  async checkDuplicateCode(code, clinicId, excludeId = null) {
    if (!code) return false;

    let query = 'SELECT id FROM treatments WHERE code = $1 AND clinic_id = $2';
    const params = [code, clinicId];
    
    if (excludeId) {
      query += ' AND id != $3';
      params.push(excludeId);
    }

    const { rows } = await pool.query(query, params);
    return rows.length > 0;
  }

  /**
   * Create treatment
   */
  async createTreatment(data, userId, clinicId) {
    // Check for duplicate code
    if (data.code) {
      const isDuplicate = await this.checkDuplicateCode(data.code, clinicId);
      if (isDuplicate) {
        throw new ConflictError('Treatment code already exists');
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO treatments (
        clinic_id, name, code, category, description,
        duration_minutes, price, cost, tooth_surface,
        requires_lab, insurance_code, notes, is_active,
        color_code, icon, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        clinicId, data.name, data.code || null, data.category,
        data.description || null, data.durationMinutes || 30,
        data.price, data.cost || null, data.toothSurface || 'none',
        data.requiresLab || false, data.insuranceCode || null,
        data.notes || null, data.isActive !== false,
        data.colorCode || null, data.icon || null, userId, userId,
      ]
    );

    return await this.getTreatmentById(rows[0].id, clinicId);
  }

  /**
   * Update treatment
   */
  async updateTreatment(id, data, userId, clinicId) {
    const existing = await this.getTreatmentById(id, clinicId);

    // Check for duplicate code
    if (data.code && data.code !== existing.code) {
      const isDuplicate = await this.checkDuplicateCode(data.code, clinicId, id);
      if (isDuplicate) {
        throw new ConflictError('Treatment code already exists');
      }
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fieldMap = {
      name: 'name',
      code: 'code',
      category: 'category',
      description: 'description',
      durationMinutes: 'duration_minutes',
      price: 'price',
      cost: 'cost',
      toothSurface: 'tooth_surface',
      requiresLab: 'requires_lab',
      insuranceCode: 'insurance_code',
      notes: 'notes',
      isActive: 'is_active',
      colorCode: 'color_code',
      icon: 'icon',
    };

    Object.entries(fieldMap).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(data[key] === '' ? null : data[key]);
        paramIndex++;
      }
    });

    updates.push(`updated_by = $${paramIndex}`);
    params.push(userId);
    paramIndex++;

    updates.push(`updated_at = NOW()`);

    params.push(id, clinicId);

    await pool.query(
      `UPDATE treatments 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND clinic_id = $${paramIndex + 1}`,
      params
    );

    return await this.getTreatmentById(id, clinicId);
  }

  /**
   * Delete treatment (soft delete)
   */
  async deleteTreatment(id, clinicId) {
    await this.getTreatmentById(id, clinicId);

    await pool.query(
      `UPDATE treatments SET is_active = false, updated_at = NOW() 
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    return { success: true };
  }

  /**
   * Get treatment categories with counts
   */
  async getCategories(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        category,
        COUNT(*) as treatment_count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
      FROM treatments
      WHERE clinic_id = $1
      GROUP BY category
      ORDER BY category`,
      [clinicId]
    );

    return rows;
  }

  /**
   * Get popular treatments
   */
  async getPopularTreatments(clinicId, limit = 10) {
    const { rows } = await pool.query(
      `SELECT 
        t.id, t.name, t.code, t.category, t.price,
        t.duration_minutes, t.color_code, t.icon,
        COUNT(at.id) as usage_count,
        SUM(i.total_price) as revenue_generated
      FROM treatments t
      LEFT JOIN appointment_treatments at ON t.id = at.treatment_id
      LEFT JOIN invoice_items i ON t.id = i.treatment_id
      WHERE t.clinic_id = $1 AND t.is_active = true
      GROUP BY t.id
      ORDER BY usage_count DESC, revenue_generated DESC
      LIMIT $2`,
      [clinicId, limit]
    );

    return rows.map(row => ({
      ...this.formatTreatment(row),
      usageCount: parseInt(row.usage_count),
      revenueGenerated: parseFloat(row.revenue_generated) || 0,
    }));
  }

  /**
   * Bulk import treatments
   */
  async bulkImportTreatments(treatments, userId, clinicId) {
    const results = {
      created: [],
      failed: [],
      total: treatments.length,
    };

    for (const treatment of treatments) {
      try {
        const created = await this.createTreatment(treatment, userId, clinicId);
        results.created.push(created);
      } catch (err) {
        results.failed.push({
          treatment,
          error: err.message,
        });
      }
    }

    return results;
  }

  /**
   * Get treatment statistics
   */
  async getTreatmentStats(clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_treatments,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_treatments,
        COUNT(DISTINCT category) as category_count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price,
        AVG(duration_minutes) as avg_duration,
        COUNT(CASE WHEN requires_lab = true THEN 1 END) as lab_treatments
      FROM treatments
      WHERE clinic_id = $1`,
      [clinicId]
    );

    return rows[0];
  }

  /**
   * Format treatment for response
   */
  formatTreatment(row) {
    return {
      id: row.id,
      clinicId: row.clinic_id,
      name: row.name,
      code: row.code,
      category: row.category,
      description: row.description,
      durationMinutes: row.duration_minutes,
      price: parseFloat(row.price),
      cost: row.cost ? parseFloat(row.cost) : null,
      profitMargin: row.cost ? ((row.price - row.cost) / row.price * 100).toFixed(2) : null,
      toothSurface: row.tooth_surface,
      requiresLab: row.requires_lab,
      insuranceCode: row.insurance_code,
      notes: row.notes,
      isActive: row.is_active,
      colorCode: row.color_code,
      icon: row.icon,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdByName: row.created_by_name,
      updatedByName: row.updated_by_name,
      usageCount: row.usage_count ? parseInt(row.usage_count) : 0,
    };
  }
}

module.exports = new TreatmentService();