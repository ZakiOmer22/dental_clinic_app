const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class ReferralService {
  async getReferrals(clinicId, filters) {
    const { page, limit, patientId, status } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE r.clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (patientId) {
      where += ` AND r.patient_id = $${i++}`;
      params.push(patientId);
    }

    if (status) {
      where += ` AND r.status = $${i++}`;
      params.push(status);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM referrals r ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT r.*, 
              p.full_name as patient_name
       FROM referrals r
       LEFT JOIN patients p ON r.patient_id = p.id
       ${where}
       ORDER BY r.referred_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      referrals: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getReferralById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM referrals WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Referral');

    return rows[0];
  }

  async createReferral(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO referrals 
       (clinic_id, patient_id, referral_to, reason, urgency, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        clinicId,
        data.patientId,
        data.referredTo || data.referral_to,
        data.reason,
        data.urgency || 'routine',
      ]
    );

    return rows[0];
  }

  async updateReferral(id, data, userId, clinicId) {
    await this.getReferralById(id, clinicId);

    const { rows } = await pool.query(
      `UPDATE referrals
       SET reason = COALESCE($1, reason),
           urgency = COALESCE($2, urgency),
           feedback_notes = COALESCE($3, feedback_notes)
       WHERE id = $4 AND clinic_id = $5
       RETURNING *`,
      [data.reason, data.urgency, data.notes, id, clinicId]
    );

    return rows[0];
  }

  async updateStatus(id, status, userId, clinicId) {
    const allowed = ['pending', 'accepted', 'completed', 'rejected'];

    if (!allowed.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const { rows } = await pool.query(
      `UPDATE referrals
       SET status = $1
       WHERE id = $2 AND clinic_id = $3
       RETURNING *`,
      [status, id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Referral');

    return rows[0];
  }

  async addFeedback(id, feedback, userId, clinicId) {
    const { rows } = await pool.query(
      `UPDATE referrals
       SET feedback_notes = $1,
           status = 'completed'
       WHERE id = $2 AND clinic_id = $3
       RETURNING *`,
      [feedback, id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Referral');

    return rows[0];
  }
}

module.exports = new ReferralService();