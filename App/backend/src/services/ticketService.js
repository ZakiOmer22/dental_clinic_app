const pool = require('../db/pool');
const { NotFoundError } = require('../../utils/errors');

class TicketService {
  async getTickets(clinicId, filters) {
    const { page, limit, status, assignedTo } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE t.clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (status) {
      where += ` AND t.status = $${i++}`;
      params.push(status);
    }

    if (assignedTo) {
      where += ` AND t.assigned_to = $${i++}`;
      params.push(assignedTo);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM tickets t ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT t.*,
              u.full_name as assigned_to_name
       FROM tickets t
       LEFT JOIN users u ON t.assigned_to = u.id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      tickets: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getTicketById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM tickets WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Ticket');

    return rows[0];
  }

    async createTicket(data, userId, clinicId) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO tickets
         (clinic_id, title, description, status, created_by)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [
          clinicId,
          data.title || data.subject || 'Untitled',
          data.description || '',
          'open',
          userId,
        ]
      );
      return rows[0];
    } catch (err) {
      console.error('createTicket error:', err.message, err.stack);
      throw err;
    }
  }

  async updateTicket(id, data, userId, clinicId) {
    await this.getTicketById(id, clinicId);

    const { rows } = await pool.query(
      `UPDATE tickets
       SET status = COALESCE($1, status)
       WHERE id = $2 AND clinic_id = $3
       RETURNING *`,
      [data.status, id, clinicId]
    );

    return rows[0];
  }

  async assignTicket(id, assignedTo, userId, clinicId) {
    const { rows } = await pool.query(
      `UPDATE tickets
       SET assigned_to = $1,
           status = 'in_progress'
       WHERE id = $2 AND clinic_id = $3
       RETURNING *`,
      [assignedTo, id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Ticket');

    return rows[0];
  }
}

module.exports = new TicketService();