const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// ═══════════════════════════════════════════════════════
// GET /recall
// ═══════════════════════════════════════════════════════
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;

    const params = [req.user.clinicId];
    let where = 'p.clinic_id = $1';

    if (status) {
      params.push(status);
      where += ` AND rs.status = $${params.length}`;
    }

    const { rows } = await pool.query(
      `SELECT rs.*,
              p.full_name AS patient_name,
              p.phone AS patient_phone
       FROM recall_schedule rs
       JOIN patients p ON rs.patient_id = p.id
       WHERE ${where}
       ORDER BY rs.next_due_date`,
      params
    );

    res.json({ data: rows });
  } catch (err) {
    console.error('Recall GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════
// PATCH status (SECURED)
// ═══════════════════════════════════════════════════════
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const { rows } = await pool.query(
      `UPDATE recall_schedule rs
       SET status = $1,
           updated_at = NOW()
       FROM patients p
       WHERE rs.patient_id = p.id
         AND rs.id = $2
         AND p.clinic_id = $3
       RETURNING rs.*`,
      [status, req.params.id, req.user.clinicId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;