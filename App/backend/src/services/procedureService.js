const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class ProcedureService {
  async getProcedures(clinicId, filters = {}) {
    const { page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE pr.clinic_id = $1';
    const params = [clinicId];
    let paramIndex = 2;

    const count = await pool.query(
      `SELECT COUNT(*) FROM procedures pr ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT 
        pr.id, pr.clinic_id, pr.name, pr.cdt_code, pr.category,
        pr.description, pr.duration_minutes, pr.base_price,
        pr.requires_lab, pr.is_active, pr.created_at
       FROM procedures pr
       ${where}
       ORDER BY pr.name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      procedures: data.rows.map(row => ({
        id: row.id,
        clinicId: row.clinic_id,
        name: row.name,
        code: row.cdt_code,
        category: row.category,
        description: row.description,
        durationMinutes: row.duration_minutes,
        basePrice: parseFloat(row.base_price),
        requiresLab: row.requires_lab,
        isActive: row.is_active,
        createdAt: row.created_at,
        patientFirstName: null,
        patientLastName: null,
        dentistName: null,
        treatmentName: null,
        status: row.is_active ? 'active' : 'inactive',
        cost: parseFloat(row.base_price),
        notes: null,
      })),
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getProcedureById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT pr.id, pr.clinic_id, pr.name, pr.cdt_code, pr.category,
              pr.description, pr.duration_minutes, pr.base_price,
              pr.requires_lab, pr.is_active, pr.created_at
       FROM procedures pr
       WHERE pr.id = $1 AND pr.clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Procedure');

    const row = rows[0];
    return {
      id: row.id,
      clinicId: row.clinic_id,
      name: row.name,
      code: row.cdt_code,
      category: row.category,
      description: row.description,
      durationMinutes: row.duration_minutes,
      basePrice: parseFloat(row.base_price),
      requiresLab: row.requires_lab,
      isActive: row.is_active,
      createdAt: row.created_at,
      status: row.is_active ? 'active' : 'inactive',
      cost: parseFloat(row.base_price),
      notes: null,
    };
  }

  async createProcedure(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO procedures
       (clinic_id, name, cdt_code, category, description, duration_minutes, base_price, requires_lab, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        clinicId,
        data.name,
        data.code || null,
        data.category || null,
        data.description || null,
        data.durationMinutes || 30,
        data.basePrice || data.cost || 0,
        data.requiresLab || false,
        data.isActive !== false,
      ]
    );

    return await this.getProcedureById(rows[0].id, clinicId);
  }

  async updateProcedure(id, data, userId, clinicId) {
    await this.getProcedureById(id, clinicId);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); params.push(data.name); }
    if (data.code !== undefined) { updates.push(`cdt_code = $${paramIndex++}`); params.push(data.code); }
    if (data.category !== undefined) { updates.push(`category = $${paramIndex++}`); params.push(data.category); }
    if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(data.description); }
    if (data.durationMinutes !== undefined) { updates.push(`duration_minutes = $${paramIndex++}`); params.push(data.durationMinutes); }
    if (data.basePrice !== undefined || data.cost !== undefined) { updates.push(`base_price = $${paramIndex++}`); params.push(data.basePrice || data.cost); }
    if (data.requiresLab !== undefined) { updates.push(`requires_lab = $${paramIndex++}`); params.push(data.requiresLab); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${paramIndex++}`); params.push(data.isActive); }

    if (updates.length === 0) {
      return await this.getProcedureById(id, clinicId);
    }

    params.push(id, clinicId);

    const { rows } = await pool.query(
      `UPDATE procedures SET ${updates.join(', ')} WHERE id = $${paramIndex} AND clinic_id = $${paramIndex + 1} RETURNING *`,
      params
    );

    return await this.getProcedureById(rows[0].id, clinicId);
  }

  async updateStatus(id, status, userId, clinicId) {
    const { rows } = await pool.query(
      `UPDATE procedures
       SET is_active = $1
       WHERE id = $2 AND clinic_id = $3
       RETURNING *`,
      [status === 'active', id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Procedure');

    return await this.getProcedureById(rows[0].id, clinicId);
  }
}

module.exports = new ProcedureService();