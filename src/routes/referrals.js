const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// ═══════════════════════════════════════════════════════
// GET /referrals (secured + clinic-scoped)
// ═══════════════════════════════════════════════════════
router.get('/', auth, async (req, res) => {
  try {
    const { status, urgency, patientId, page = 1, limit = 50 } = req.query;

    const params = [req.user.clinicId];
    let where = 'p.clinic_id = $1';

    if (status) {
      params.push(status);
      where += ` AND r.status = $${params.length}`;
    }

    if (urgency) {
      params.push(urgency);
      where += ` AND r.urgency = $${params.length}`;
    }

    if (patientId) {
      params.push(patientId);
      where += ` AND r.patient_id = $${params.length}`;
    }

    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const dataQuery = `
      SELECT r.*,
             p.full_name AS patient_name,
             p.patient_number,
             u.full_name AS referred_by_name
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON r.referred_by = u.id
      WHERE ${where}
      ORDER BY r.referred_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `;

    const { rows } = await pool.query(dataQuery, params);

    const countQuery = `
      SELECT COUNT(*) 
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      WHERE ${where}
    `;

    const count = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      data: rows,
      total: Number(count.rows[0].count),
      page: Number(page),
      limit: Number(limit)
    });

  } catch (err) {
    console.error('Referrals GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════
// GET /referrals/:id (SECURED)
// ═══════════════════════════════════════════════════════
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*,
              p.full_name AS patient_name,
              u.full_name AS referred_by_name
       FROM referrals r
       JOIN patients p ON r.patient_id = p.id
       JOIN users u ON r.referred_by = u.id
       WHERE r.id = $1 AND p.clinic_id = $2`,
      [req.params.id, req.user.clinicId]
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

// ═══════════════════════════════════════════════════════
// POST /referrals
// ═══════════════════════════════════════════════════════
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientId,
      referralTo,
      specialty,
      reason,
      urgency = 'routine',
      notes
    } = req.body;

    if (!patientId || !reason) {
      return res.status(400).json({ error: 'patientId and reason required' });
    }

    // SECURITY: ensure patient belongs to clinic
    const patientCheck = await pool.query(
      `SELECT id FROM patients WHERE id = $1 AND clinic_id = $2`,
      [patientId, req.user.clinicId]
    );

    if (!patientCheck.rows[0]) {
      return res.status(403).json({ error: 'Invalid patient access' });
    }

    const { rows } = await pool.query(
      `INSERT INTO referrals
        (patient_id, referred_by, referral_to, specialty, reason, urgency, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        patientId,
        req.user.id,
        referralTo || null,
        specialty || null,
        reason,
        urgency,
        notes || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      referralTo,
      specialty,
      reason,
      urgency,
      notes,
      feedbackNotes
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE referrals r
       SET referral_to=$1,
           specialty=$2,
           reason=$3,
           urgency=$4,
           notes=$5,
           feedback_notes=$6
       FROM patients p
       WHERE r.patient_id = p.id
         AND r.id = $7
         AND p.clinic_id = $8
       RETURNING r.*`,
      [
        referralTo || null,
        specialty || null,
        reason,
        urgency || 'routine',
        notes || null,
        feedbackNotes || null,
        req.params.id,
        req.user.clinicId
      ]
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

// ═══════════════════════════════════════════════════════
// STATUS UPDATE
// ═══════════════════════════════════════════════════════
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, feedbackNotes } = req.body;

    const completedAt = status === 'completed'
      ? new Date().toISOString()
      : null;

    const { rows } = await pool.query(
      `UPDATE referrals r
       SET status=$1,
           feedback_notes=$2,
           completed_at=$3
       FROM patients p
       WHERE r.patient_id = p.id
         AND r.id = $4
         AND p.clinic_id = $5
       RETURNING r.*`,
      [
        status,
        feedbackNotes || null,
        completedAt,
        req.params.id,
        req.user.clinicId
      ]
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

// ═══════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM referrals r
       USING patients p
       WHERE r.patient_id = p.id
         AND r.id = $1
         AND p.clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;