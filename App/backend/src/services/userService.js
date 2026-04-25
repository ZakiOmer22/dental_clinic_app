const pool = require('../db/pool');
const bcrypt = require('bcrypt');
const { NotFoundError } = require('../../utils/errors');

class UserService {
  async getUsers(clinicId, filters) {
    const { page, limit, role, status, search } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (role) {
      where += ` AND role = $${i++}`;
      params.push(role);
    }

    if (status) {
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
      users: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getUserById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, is_active, created_at
       FROM users
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('User');

    return rows[0];
  }

  async createUser(data, creatorId, clinicId) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (
        clinic_id,
        full_name,
        email,
        password_hash,
        role,
        is_active
      )
      VALUES ($1,$2,$3,$4,$5,true)
      RETURNING id, full_name, email, role, is_active`,
      [
        clinicId,
        data.fullName,
        data.email,
        hashedPassword,
        data.role,
      ]
    );

    return rows[0];
  }

  async updateUser(id, data, userId, clinicId) {
    await this.getUserById(id, clinicId);

    const { rows } = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           role = COALESCE($2, role),
           is_active = COALESCE($3, is_active)
       WHERE id = $4 AND clinic_id = $5
       RETURNING id, full_name, email, role, is_active`,
      [data.fullName, data.role, data.status === 'active', id, clinicId]
    );

    return rows[0];
  }

  async deactivateUser(id, userId, clinicId) {
    const { rows } = await pool.query(
      `UPDATE users
       SET is_active = false
       WHERE id = $1 AND clinic_id = $2
       RETURNING id`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('User');

    return rows[0];
  }
}

module.exports = new UserService();