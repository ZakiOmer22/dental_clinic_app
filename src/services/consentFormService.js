const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class ConsentFormService {
  async getConsentForms(clinicId, filters) {
    const { page, limit, search } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE clinic_id = $1';
    const params = [clinicId];

    if (search) {
      where += ` AND title ILIKE $2`;
      params.push(`%${search}%`);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM consent_forms ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT * FROM consent_forms
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      forms: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getConsentFormById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM consent_forms WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Consent Form');

    return rows[0];
  }

  async createConsentForm(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO consent_forms (clinic_id, title, content_html, version, created_by)
       VALUES ($1, $2, $3, 1, $4)
       RETURNING *`,
      [clinicId, data.title, data.contentHtml, userId]
    );

    return rows[0];
  }

  /**
   * IMPORTANT: This creates NEW VERSION instead of overwrite
   */
  async updateConsentForm(id, data, userId, clinicId) {
    const existing = await this.getConsentFormById(id, clinicId);

    const { rows } = await pool.query(
      `INSERT INTO consent_forms (clinic_id, title, content_html, version, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        clinicId,
        data.title || existing.title,
        data.contentHtml || existing.content_html,
        existing.version + 1,
        userId,
      ]
    );

    return rows[0];
  }

  async assignToPatient(formId, patientId, userId, clinicId) {
    await this.getConsentFormById(formId, clinicId);

    const { rows } = await pool.query(
      `INSERT INTO patient_consent_forms
       (form_id, patient_id, clinic_id, status, assigned_by)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING *`,
      [formId, patientId, clinicId, userId]
    );

    return rows[0];
  }

  async signConsentForm(formId, signature, user, req) {
    if (!signature) throw new ValidationError('Signature required');

    const { rows } = await pool.query(
      `UPDATE patient_consent_forms
       SET signature_data = $1,
           status = 'signed',
           signed_at = NOW(),
           ip_address = $2
       WHERE form_id = $3
         AND patient_id = $4
         AND clinic_id = $5
         AND status = 'pending'
       RETURNING *`,
      [
        signature,
        req.ip,
        formId,
        user.patientId, // depends on your auth design
        user.clinicId,
      ]
    );

    if (!rows.length) throw new NotFoundError('Assigned Consent Form');

    return rows[0];
  }
}

module.exports = new ConsentFormService();