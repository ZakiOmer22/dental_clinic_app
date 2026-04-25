const pool = require('../db/pool');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class FinancialService {
  async getInvoices(clinicId, filters) {
    const { page, limit, patientId, status, fromDate, toDate } = filters;
    const offset = (page - 1) * limit;

    let where = 'WHERE i.clinic_id = $1';
    const params = [clinicId];
    let i = 2;

    if (patientId) {
      where += ` AND i.patient_id = $${i++}`;
      params.push(patientId);
    }

    if (status) {
      where += ` AND i.status = $${i++}`;
      params.push(status);
    }

    if (fromDate) {
      where += ` AND i.created_at >= $${i++}`;
      params.push(fromDate);
    }

    if (toDate) {
      where += ` AND i.created_at <= $${i++}`;
      params.push(toDate);
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM invoices i ${where}`,
      params
    );

    const data = await pool.query(
      `SELECT i.*,
              p.first_name,
              p.last_name
       FROM invoices i
       LEFT JOIN patients p ON i.patient_id = p.id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return {
      invoices: data.rows,
      pagination: { total: parseInt(count.rows[0].count) },
    };
  }

  async getInvoiceById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM invoices
       WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new NotFoundError('Invoice');

    return rows[0];
  }

  async createInvoice(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO invoices
       (clinic_id, patient_id, total_amount, status, created_by)
       VALUES ($1,$2,$3,'pending',$4)
       RETURNING *`,
      [
        clinicId,
        data.patientId,
        data.totalAmount,
        userId,
      ]
    );

    return rows[0];
  }

  async recordPayment(invoiceId, data, userId, clinicId) {
    const invoice = await this.getInvoiceById(invoiceId, clinicId);

    const { rows } = await pool.query(
      `INSERT INTO payments
       (invoice_id, amount, method, paid_at, created_by)
       VALUES ($1,$2,$3,NOW(),$4)
       RETURNING *`,
      [
        invoiceId,
        data.amount,
        data.method,
        userId,
      ]
    );

    // update invoice status
    await pool.query(
      `UPDATE invoices
       SET status = 'paid'
       WHERE id = $1`,
      [invoiceId]
    );

    return rows[0];
  }
}

module.exports = new FinancialService();