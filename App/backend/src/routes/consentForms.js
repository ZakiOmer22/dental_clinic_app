
// ─────────────────────────────────────────────────────────────────────────────
// src/routes/consentForms.js
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { patientId, isSigned, page = 1, limit = 50 } = req.query;
    const params = [req.user.clinicId];
    let where = 'p.clinic_id = $1';
    if (patientId) { params.push(patientId); where += ` AND cf.patient_id = $${params.length}`; }
    if (isSigned !== undefined) { params.push(isSigned === 'true'); where += ` AND cf.is_signed = $${params.length}`; }
    params.push(Number(limit), (Number(page)-1)*Number(limit));
 
    const { rows } = await pool.query(
      `SELECT cf.*, p.full_name AS patient_name, p.patient_number
       FROM consent_forms cf JOIN patients p ON cf.patient_id = p.id
       WHERE ${where} ORDER BY cf.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params
    );
    const count = await pool.query(`SELECT COUNT(*) FROM consent_forms cf JOIN patients p ON cf.patient_id = p.id WHERE ${where}`, params.slice(0,-2));
    res.json({ data: rows, total: Number(count.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cf.*, p.full_name AS patient_name FROM consent_forms cf JOIN patients p ON cf.patient_id = p.id WHERE cf.id = $1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, treatmentId, formType, signedBy, witness, notes } = req.body;
    if (!patientId || !formType) return res.status(400).json({ error: 'patientId and formType required' });
    const isSigned = !!(signedBy);
    const { rows } = await pool.query(
      `INSERT INTO consent_forms (patient_id,treatment_id,form_type,signed_by,witness,is_signed,signed_at,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patientId, treatmentId||null, formType, signedBy||null, witness||null, isSigned, isSigned?new Date():null, notes||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.patch('/:id/sign', auth, async (req, res) => {
  try {
    const { signedBy, witness } = req.body;
    const { rows } = await pool.query(
      `UPDATE consent_forms SET is_signed=TRUE, signed_by=$1, witness=$2, signed_at=NOW() WHERE id=$3 RETURNING *`,
      [signedBy, witness||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM consent_forms WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
module.exports = router;