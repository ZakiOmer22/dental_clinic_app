const pool = require('../db/pool');
const { NotFoundError, ValidationError, ConflictError } = require('../../utils/errors');

class TreatmentService {
  async getTreatmentRecords(clinicId, filters = {}) {
  const { page = 1, limit = 50, search = '' } = filters;
  const offset = (page - 1) * limit;

  const params = [];
  let whereClause = 'WHERE 1=1';
  let paramIndex = 1;

  if (search) {
    whereClause += ` AND (p.full_name ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR t.diagnosis ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM treatments t
     LEFT JOIN patients p ON t.patient_id = p.id
     LEFT JOIN users u ON t.doctor_id = u.id
     ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const dataResult = await pool.query(
    `SELECT 
       t.id, t.patient_id, t.doctor_id, t.appointment_id,
       t.diagnosis, t.chief_complaint, t.clinical_notes,
       t.treatment_notes, t.follow_up_notes, t.follow_up_date,
       t.is_completed, t.created_at, t.updated_at,
       p.full_name as patient_name, p.patient_number,
       u.full_name as doctor_name
     FROM treatments t
     LEFT JOIN patients p ON t.patient_id = p.id
     LEFT JOIN users u ON t.doctor_id = u.id
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    treatments: dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      appointmentId: row.appointment_id,
      diagnosis: row.diagnosis,
      chiefComplaint: row.chief_complaint,
      clinicalNotes: row.clinical_notes,
      treatmentNotes: row.treatment_notes,
      followUpNotes: row.follow_up_notes,
      followUpDate: row.follow_up_date,
      follow_up_date: row.follow_up_date,   
      isCompleted: row.is_completed,
      is_completed: row.is_completed,       
      created_at: row.created_at,           
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      patient_name: row.patient_name,
      patient_number: row.patient_number,
      doctor_name: row.doctor_name,
      total_cost: 0,
    })),
    pagination: { page, limit, total },
  };
}
    /**
   * Get all treatments (treatment records for frontend list)
   */
  async getTreatments(clinicId, filters = {}) {
    return await this.getTreatmentRecords(clinicId, filters);
  }
  /**
   * Get single procedure
   */
  async getTreatmentById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT 
        p.id, p.clinic_id, p.name, p.cdt_code as code, p.category,
        p.description, p.duration_minutes, p.base_price as price,
        p.requires_lab, p.is_active,
        p.created_at
      FROM procedures p
      WHERE p.id = $1 AND p.clinic_id = $2`,
      [id, clinicId]
    );
    if (!rows.length) {
      throw new NotFoundError('Treatment');
    }

    return this.formatTreatment(rows[0]);
  }

  /**
   * Check for duplicate CDT code
   */
  async checkDuplicateCode(code, clinicId, excludeId = null) {
    if (!code) return false;

    let query = 'SELECT id FROM procedures WHERE cdt_code = $1 AND clinic_id = $2';
    const params = [code, clinicId];

    if (excludeId) {
      query += ' AND id != $3';
      params.push(excludeId);
    }

    const { rows } = await pool.query(query, params);
    return rows.length > 0;
  }

  /**
   * Create procedure
   */
  async createTreatment(data, userId, clinicId) {
    if (data.code) {
      const isDuplicate = await this.checkDuplicateCode(data.code, clinicId);
      if (isDuplicate) {
        throw new ConflictError('Treatment code already exists');
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO procedures (
        clinic_id, name, cdt_code, category, description,
        duration_minutes, base_price,
        requires_lab, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        clinicId, data.name, data.code || null, data.category,
        data.description || null, data.durationMinutes || 30,
        data.price, data.requiresLab || false, data.isActive !== false,
      ]
    );

    return await this.getTreatmentById(rows[0].id, clinicId);
  }

  /**
   * Update procedure
   */
  async updateTreatment(id, data, userId, clinicId) {
    const existing = await this.getTreatmentById(id, clinicId);

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
      code: 'cdt_code',
      category: 'category',
      description: 'description',
      durationMinutes: 'duration_minutes',
      price: 'base_price',
      requiresLab: 'requires_lab',
      isActive: 'is_active',
    };

    Object.entries(fieldMap).forEach(([key, dbField]) => {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(data[key] === '' ? null : data[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return existing;
    }

    params.push(id, clinicId);

    await pool.query(
      `UPDATE procedures 
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
      `UPDATE procedures SET is_active = false 
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
        MIN(base_price) as min_price,
        MAX(base_price) as max_price,
        AVG(base_price) as avg_price
      FROM procedures
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
        p.id, p.name, p.cdt_code as code, p.category, p.base_price as price,
        p.duration_minutes,
        COUNT(t.id) as usage_count
      FROM procedures p
      LEFT JOIN treatments t ON p.id = t.procedure_id
      WHERE p.clinic_id = $1 AND p.is_active = true
      GROUP BY p.id
      ORDER BY usage_count DESC
      LIMIT $2`,
      [clinicId, limit]
    );

    return rows.map(row => ({
      ...this.formatTreatment(row),
      usageCount: parseInt(row.usage_count),
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
        MIN(base_price) as min_price,
        MAX(base_price) as max_price,
        AVG(base_price) as avg_price,
        AVG(duration_minutes) as avg_duration,
        COUNT(CASE WHEN requires_lab = true THEN 1 END) as lab_treatments
      FROM procedures
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
      price: parseFloat(row.price || 0),
      cost: null,
      profitMargin: null,
      requiresLab: row.requires_lab,
      notes: null,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by || row.created_by,
      createdByName: null,
      updatedByName: null,
    };
  }
}


module.exports = new TreatmentService();