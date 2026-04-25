const pool = require('../db/pool');
const { NotFoundError } = require('../../utils/errors');

class AuditService {
  async getAudits(clinicId, filters) {
    const {
      page,
      limit,
      entity,
      entityId,
      action,
      userId,
      fromDate,
      toDate,
    } = filters;

    const offset = (page - 1) * limit;

    let where = 'WHERE a.clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (entity) {
      where += ` AND a.entity = $${i++}`;
      params.push(entity);
    }

    if (entityId) {
      where += ` AND a.entity_id = $${i++}`;
      params.push(entityId);
    }

    if (action) {
      where += ` AND a.action = $${i++}`;
      params.push(action);
    }

    if (userId) {
      where += ` AND a.user_id = $${i++}`;
      params.push(userId);
    }

    if (fromDate) {
      where += ` AND a.created_at >= $${i++}`;
      params.push(fromDate);
    }

    if (toDate) {
      where += ` AND a.created_at <= $${i++}`;
      params.push(toDate);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM audit_logs a ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT a.*,
              u.full_name as user_name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      audits: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getAuditById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM audit_logs
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Audit log');

    return rows[0];
  }
}

module.exports = new AuditService();