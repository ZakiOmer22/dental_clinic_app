const pool = require('../db/pool');
const { NotFoundError } = require('../../utils/errors');

class RecallService {
  async getRecalls(clinicId, filters) {
    const { page, limit, status, patientId, dueBefore, dueAfter } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE r.clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (status) {
      where += ` AND r.status = $${i++}`;
      params.push(status);
    }

    if (patientId) {
      where += ` AND r.patient_id = $${i++}`;
      params.push(patientId);
    }

    if (dueBefore) {
      where += ` AND r.due_date <= $${i++}`;
      params.push(dueBefore);
    }

    if (dueAfter) {
      where += ` AND r.due_date >= $${i++}`;
      params.push(dueAfter);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM recalls r ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT r.*,
              p.first_name,
              p.last_name,
              p.phone
       FROM recalls r
       LEFT JOIN patients p ON r.patient_id = p.id
       ${where}
       ORDER BY r.due_date ASC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      recalls: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getRecallById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM recalls WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Recall');

    return rows[0];
  }

  async createRecall(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO recalls
       (clinic_id, patient_id, reason, due_date, status, created_by)
       VALUES ($1,$2,$3,$4,'pending',$5)
       RETURNING *`,
      [
        clinicId,
        data.patientId,
        data.reason,
        data.dueDate,
        userId,
      ]
    );

    return rows[0];
  }

  async updateRecall(id, data, userId, clinicId) {
    await this.getRecallById(id, clinicId);

    const { rows } = await pool.query(
      `UPDATE recalls
       SET reason = COALESCE($1, reason),
           due_date = COALESCE($2, due_date),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4 AND clinic_id = $5
       RETURNING *`,
      [data.reason, data.dueDate, data.status, id, clinicId]
    );

    return rows[0];
  }

  async completeRecall(id, userId, clinicId) {
    const { rows } = await pool.query(
      `UPDATE recalls
       SET status = 'completed',
           updated_at = NOW()
       WHERE id = $1 AND clinic_id = $2
       RETURNING *`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Recall');

    return rows[0];
  }
}

module.exports = new RecallService();