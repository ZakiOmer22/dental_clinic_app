
// ─────────────────────────────────────────────────────────────────────────────
// src/routes/referrals.js
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { status, urgency, patientId, page = 1, limit = 50 } = req.query;
    const params = [req.user.clinicId];
    let where = 'p.clinic_id = $1';
    if (status)    { params.push(status);    where += ` AND r.status = $${params.length}`; }
    if (urgency)   { params.push(urgency);   where += ` AND r.urgency = $${params.length}`; }
    if (patientId) { params.push(patientId); where += ` AND r.patient_id = $${params.length}`; }
    params.push(Number(limit), (Number(page)-1)*Number(limit));
 
    const { rows } = await pool.query(
      `SELECT r.*, p.full_name AS patient_name, p.patient_number, u.full_name AS referred_by_name
       FROM referrals r JOIN patients p ON r.patient_id = p.id JOIN users u ON r.referred_by = u.id
       WHERE ${where} ORDER BY r.referred_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params
    );
    const count = await pool.query(`SELECT COUNT(*) FROM referrals r JOIN patients p ON r.patient_id = p.id WHERE ${where}`, params.slice(0,-2));
    res.json({ data: rows, total: Number(count.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, p.full_name AS patient_name, u.full_name AS referred_by_name
       FROM referrals r JOIN patients p ON r.patient_id = p.id JOIN users u ON r.referred_by = u.id
       WHERE r.id = $1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, referralTo, specialty, reason, urgency = 'routine', notes } = req.body;
    if (!patientId || !reason) return res.status(400).json({ error: 'patientId and reason required' });
    const { rows } = await pool.query(
      `INSERT INTO referrals (patient_id,referred_by,referral_to,specialty,reason,urgency,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [patientId, req.user.id, referralTo||null, specialty||null, reason, urgency, notes||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.put('/:id', auth, async (req, res) => {
  try {
    const { referralTo, specialty, reason, urgency, notes, feedbackNotes } = req.body;
    const { rows } = await pool.query(
      `UPDATE referrals SET referral_to=$1,specialty=$2,reason=$3,urgency=$4,notes=$5,feedback_notes=$6 WHERE id=$7 RETURNING *`,
      [referralTo||null, specialty||null, reason, urgency||'routine', notes||null, feedbackNotes||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, feedbackNotes } = req.body;
    const completedAt = status === 'completed' ? new Date().toISOString().slice(0,10) : null;
    const { rows } = await pool.query(
      `UPDATE referrals SET status=$1, feedback_notes=$2, completed_at=$3 WHERE id=$4 RETURNING *`,
      [status, feedbackNotes||null, completedAt, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM referrals WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
module.exports = router;