
// ─────────────────────────────────────────────────────────────────────────────
// src/routes/recall.js
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const params = [req.user.clinicId];
    let where = 'p.clinic_id = $1';
    if (status) { params.push(status); where += ` AND rs.status = $${params.length}`; }
    const { rows } = await pool.query(
      `SELECT rs.*, p.full_name AS patient_name, p.phone AS patient_phone
       FROM recall_schedule rs JOIN patients p ON rs.patient_id = p.id
       WHERE ${where} ORDER BY rs.next_due_date`, params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      `UPDATE recall_schedule SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *`, [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
module.exports = router;
 