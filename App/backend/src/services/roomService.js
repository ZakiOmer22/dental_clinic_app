const pool = require('../db/pool');
const { NotFoundError } = require('../../utils/errors');

class RoomService {
  async getRooms(clinicId, filters) {
    const { page, limit, type } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (type) {
      where += ` AND type = $${i++}`;
      params.push(type);
    }

    const count = await pool.query(`SELECT COUNT(*) FROM rooms ${where}`, params);

    const data = await pool.query(
      `SELECT id, clinic_id, name, type, floor, is_available, notes
       FROM rooms ${where}
       ORDER BY name ASC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      rooms: data.rows.map(row => ({ ...row, status: row.is_available ? 'active' : 'inactive' })),
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getRoomById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT id, clinic_id, name, type, floor, is_available, notes
       FROM rooms WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );
    if (!rows.length) throw new NotFoundError('Room');
    return { ...rows[0], status: rows[0].is_available ? 'active' : 'inactive' };
  }

  async createRoom(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO rooms (clinic_id, name, type, floor, is_available, notes)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING id, clinic_id, name, type, floor, is_available, notes`,
      [clinicId, data.name, data.type, data.floor || null, data.notes || null]
    );
    return { ...rows[0], status: 'active' };
  }

  async updateRoom(id, data, userId, clinicId) {
    await this.getRoomById(id, clinicId);
    const updates = [];
    const params = [];
    let i = 1;
    if (data.name) { updates.push(`name = $${i++}`); params.push(data.name); }
    if (data.type) { updates.push(`type = $${i++}`); params.push(data.type); }
    if (data.floor !== undefined) { updates.push(`floor = $${i++}`); params.push(data.floor); }
    if (data.status) { updates.push(`is_available = $${i++}`); params.push(data.status === 'active'); }
    if (data.notes !== undefined) { updates.push(`notes = $${i++}`); params.push(data.notes); }
    if (updates.length === 0) return await this.getRoomById(id, clinicId);
    params.push(id, clinicId);
    const { rows } = await pool.query(
      `UPDATE rooms SET ${updates.join(', ')} WHERE id = $${i} AND clinic_id = $${i + 1}
       RETURNING id, clinic_id, name, type, floor, is_available, notes`, params
    );
    return { ...rows[0], status: rows[0].is_available ? 'active' : 'inactive' };
  }

  async deactivateRoom(id, userId, clinicId) {
    const { rows } = await pool.query(
      `UPDATE rooms SET is_available = false WHERE id = $1 AND clinic_id = $2 RETURNING id`,
      [id, clinicId]
    );
    if (!rows.length) throw new NotFoundError('Room');
    return rows[0];
  }
}

module.exports = new RoomService();