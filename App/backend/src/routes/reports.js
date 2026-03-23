const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /reports/revenue
router.get('/revenue', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT month, total_collected, payment_count, method
       FROM vw_revenue_summary
       WHERE EXISTS (
         SELECT 1 FROM payments py
         JOIN invoices i ON py.invoice_id = i.id
         WHERE i.clinic_id = $1
       )
       ORDER BY month DESC
       LIMIT 12`,
      [req.user.clinicId]
    );
    res.json({ data: rows });
  } catch (err) {
    // Fallback if view doesn't filter by clinic
    try {
      const { rows } = await pool.query(
        `SELECT DATE_TRUNC('month', py.paid_at) AS month,
                SUM(py.amount)                   AS total_collected,
                COUNT(*)                         AS payment_count,
                py.method
         FROM payments py
         JOIN invoices i ON py.invoice_id = i.id
         WHERE i.clinic_id = $1
         GROUP BY DATE_TRUNC('month', py.paid_at), py.method
         ORDER BY month DESC
         LIMIT 12`,
        [req.user.clinicId]
      );
      res.json({ data: rows });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// GET /reports/schedule
router.get('/schedule', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const { rows } = await pool.query(
      `SELECT a.id, a.scheduled_at, a.end_at, a.status, a.type, a.chief_complaint,
              p.full_name  AS patient_name,
              p.phone      AS patient_phone,
              u.full_name  AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users    u ON a.doctor_id  = u.id
       WHERE a.clinic_id = $1 AND DATE(a.scheduled_at) = $2
       ORDER BY a.scheduled_at`,
      [req.user.clinicId, targetDate]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /reports/recalls  (patients overdue for recall)
router.get('/recalls', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT rs.id, rs.next_due_date, rs.recall_type, rs.status,
              p.full_name AS patient_name, p.phone AS patient_phone, p.id AS patient_id
       FROM recall_schedule rs
       JOIN patients p ON rs.patient_id = p.id
       WHERE p.clinic_id = $1
         AND rs.next_due_date <= CURRENT_DATE
         AND rs.status IN ('pending','notified')
       ORDER BY rs.next_due_date ASC
       LIMIT 50`,
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
    const params = [req.user.clinicId];
    let where = 'WHERE clinic_id = $1';
    if (month) {
      params.push(month);
      where += ` AND TO_CHAR(expense_date, 'YYYY-MM') = $${params.length}`;
    }
    const { rows } = await pool.query(
      `SELECT * FROM expenses ${where} ORDER BY expense_date DESC`,
      params
    );
    const total = rows.reduce((a, e) => a + parseFloat(e.amount), 0);
    res.json({ data: rows, total });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
