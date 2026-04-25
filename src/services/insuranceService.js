const pool = require('../db/pool');
const { NotFoundError } = require('../../utils/errors');

class InsuranceService {
  async getInsurance(clinicId, filters) {
    const { page, limit, providerId, patientId, status } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE i.clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (providerId) {
      where += ` AND i.provider_id = $${i++}`;
      params.push(providerId);
    }

    if (patientId) {
      where += ` AND i.patient_id = $${i++}`;
      params.push(patientId);
    }

    if (status) {
      where += ` AND i.status = $${i++}`;
      params.push(status);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM insurance i ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT i.*,
              p.first_name,
              p.last_name,
              ip.name as provider_name
       FROM insurance i
       LEFT JOIN patients p ON i.patient_id = p.id
       LEFT JOIN insurance_providers ip ON i.provider_id = ip.id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      insurance: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getInsuranceById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM insurance
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Insurance');

    return rows[0];
  }

  async createInsurance(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO insurance
       (clinic_id, patient_id, provider_id, policy_number, coverage_limit, expiry_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,'active')
       RETURNING *`,
      [
        clinicId,
        data.patientId,
        data.providerId,
        data.policyNumber,
        data.coverageLimit,
        data.expiryDate,
      ]
    );

    return rows[0];
  }

  async updateInsurance(id, data, userId, clinicId) {
    await this.getInsuranceById(id, clinicId);

    const { rows } = await pool.query(
      `UPDATE insurance
       SET coverage_limit = COALESCE($1, coverage_limit),
           expiry_date = COALESCE($2, expiry_date),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4 AND clinic_id = $5
       RETURNING *`,
      [
        data.coverageLimit,
        data.expiryDate,
        data.status,
        id,
        clinicId,
      ]
    );

    return rows[0];
  }
}

module.exports = new InsuranceService();