const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// GET /reports/revenue
router.get('/revenue', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT DATE_TRUNC('month', py.paid_at) AS month,
             SUM(py.amount) AS total_collected,
             COUNT(*) AS payment_count,
             py.method
      FROM payments py
      JOIN invoices i ON py.invoice_id = i.id
      WHERE i.clinic_id = $1
      GROUP BY month, py.method
      ORDER BY month DESC
      LIMIT 12
      `,
      [req.user.clinicId]
    );

    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reports/schedule
router.get('/schedule', auth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const { rows } = await pool.query(
      `
      SELECT a.*, p.full_name AS patient_name, u.full_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.doctor_id = u.id
      WHERE a.clinic_id = $1 AND DATE(a.scheduled_at) = $2
      ORDER BY a.scheduled_at
      `,
      [req.user.clinicId, date]
    );

    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reports/recalls
router.get('/recalls', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT rs.*, p.full_name AS patient_name, p.phone
      FROM recall_schedule rs
      JOIN patients p ON rs.patient_id = p.id
      WHERE p.clinic_id = $1
        AND rs.next_due_date <= CURRENT_DATE
      ORDER BY rs.next_due_date
      `,
      [req.user.clinicId]
    );

    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reports/expenses
router.get('/expenses', auth, async (req, res) => {
  try {
    const { month } = req.query;

    let where = 'WHERE clinic_id = $1';
    const params = [req.user.clinicId];

    if (month) {
      params.push(month);
      where += ` AND TO_CHAR(expense_date, 'YYYY-MM') = $2`;
    }

    const { rows } = await pool.query(
      `SELECT * FROM expenses ${where} ORDER BY expense_date DESC`,
      params
    );

    const total = rows.reduce((a, b) => a + Number(b.amount), 0);

    res.json({ data: rows, total });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;