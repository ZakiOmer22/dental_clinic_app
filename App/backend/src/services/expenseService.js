const pool = require('../db/pool');

class ExpenseService {
  async getAll(clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM expenses WHERE clinic_id = $1 ORDER BY created_at DESC`,
      [clinicId]
    );
    return rows;
  }

  async getById(id, clinicId) {
    const { rows } = await pool.query(
      `SELECT * FROM expenses WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    if (!rows.length) throw new Error('Expense not found');
    return rows[0];
  }

  async create(data, userId, clinicId) {
    const { rows } = await pool.query(
      `INSERT INTO expenses (
        clinic_id, recorded_by, category, description, amount,
        payment_method, reference, expense_date, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        clinicId,
        userId,
        data.category,
        data.description,
        data.amount,
        data.paymentMethod || null,
        data.reference || null,
        data.expenseDate || new Date(),
        data.notes || null,
      ]
    );

    return rows[0];
  }

  async update(id, data, clinicId) {
    const { rows } = await pool.query(
      `UPDATE expenses SET
        category = $1,
        description = $2,
        amount = $3,
        payment_method = $4,
        reference = $5,
        notes = $6
      WHERE id = $7 AND clinic_id = $8
      RETURNING *`,
      [
        data.category,
        data.description,
        data.amount,
        data.paymentMethod,
        data.reference,
        data.notes,
        id,
        clinicId,
      ]
    );

    return rows[0];
  }

  async delete(id, clinicId) {
    await pool.query(
      `DELETE FROM expenses WHERE id = $1 AND clinic_id = $2`,
      [id, clinicId]
    );

    return { success: true };
  }
}

module.exports = new ExpenseService();