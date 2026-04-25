const pool = require('../db/pool');
const bcrypt = require('bcrypt');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class StaffService {
  async getStaff(clinicId, filters) {
    const { page, limit, role, status, search } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (role) {
      where += ` AND role = $${i++}`;
      params.push(role);
    }

    if (status !== undefined) {
      where += ` AND is_active = $${i++}`;
      params.push(status === 'active');
    }

    if (search) {
      where += ` AND full_name ILIKE $${i++}`;
      params.push(`%${search}%`);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM users ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT id, full_name, email, role, is_active, created_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      staff: data.rows.map(row => ({
        ...row,
        status: row.is_active ? 'active' : 'inactive',
      })),
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getStaffById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, is_active
       FROM users
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Staff');

    return { ...rows[0], status: rows[0].is_active ? 'active' : 'inactive' };
  }

  async createStaff(data, userId, clinicId) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (clinic_id, full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, full_name, email, role, is_active`,
      [
        clinicId,
        data.fullName,
        data.email,
        hashedPassword,
        data.role,
      ]
    );

    return { ...rows[0], status: 'active' };
  }

  async updateStaff(id, data, userId, clinicId) {
    await this.getStaffById(id, clinicId);

    const updates = [];
    const params = [];
    let i = 1;

    if (data.fullName) { updates.push(`full_name = $${i++}`); params.push(data.fullName); }
    if (data.role) { updates.push(`role = $${i++}`); params.push(data.role); }
    if (data.status) { updates.push(`is_active = $${i++}`); params.push(data.status === 'active'); }

    if (updates.length === 0) return await this.getStaffById(id, clinicId);

    params.push(id, clinicId);

    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} AND clinic_id = $${i + 1}
       RETURNING id, full_name, email, role, is_active`,
      params
    );

    return { ...rows[0], status: rows[0].is_active ? 'active' : 'inactive' };
  }

  async deactivateStaff(id, userId, clinicId) {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = false WHERE id = $1 AND clinic_id = $2 RETURNING id`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Staff');

    return rows[0];
  }
}

module.exports = new StaffService();