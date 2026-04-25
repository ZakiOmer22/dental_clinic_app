const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// ─────────────────────────────────────────────
// GET /prescriptions (SECURED)
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { patientId, isDispensed, page = 1, limit = 50 } = req.query;

    const params = [req.user.clinicId];
    let where = `p.clinic_id = $1`;

    const baseJoin = `
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.id
      JOIN users u ON rx.doctor_id = u.id
    `;

    if (patientId) {
      params.push(patientId);
      where += ` AND rx.patient_id = $${params.length}`;
    }

    if (isDispensed !== undefined) {
      params.push(isDispensed === 'true');
      where += ` AND rx.is_dispensed = $${params.length}`;
    }

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const { rows } = await pool.query(
      `
      SELECT rx.*, 
             p.full_name AS patient_name,
             p.patient_number,
             u.full_name AS doctor_name
      ${baseJoin}
      WHERE ${where}
      ORDER BY rx.prescribed_at DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
      `,
      params
    );

    const countRes = await pool.query(
      `
      SELECT COUNT(*)
      ${baseJoin}
      WHERE ${where}
      `,
      params.slice(0, -2)
    );

    res.json({
      data: rows,
      total: Number(countRes.rows[0].count),
    });

  } catch (err) {
    console.error('Prescription GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// GET /prescriptions/:id (SECURED)
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT rx.*, 
             p.full_name AS patient_name,
             u.full_name AS doctor_name
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.id
      JOIN users u ON rx.doctor_id = u.id
      WHERE rx.id = $1
        AND p.clinic_id = $2
      `,
      [req.params.id, req.user.clinicId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// POST /prescriptions (SECURED)
// ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientId,
      treatmentId,
      medicationName,
      genericName,
      dosage,
      route,
      frequency,
      duration,
      quantity,
      refillsAllowed = 0,
      instructions
    } = req.body;

    if (!patientId || !medicationName || !dosage || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 🔒 verify patient belongs to clinic
    const patientCheck = await pool.query(
      `SELECT id FROM patients WHERE id = $1 AND clinic_id = $2`,
      [patientId, req.user.clinicId]
    );

    if (!patientCheck.rows[0]) {
      return res.status(403).json({ error: 'Invalid patient access' });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO prescriptions (
        patient_id,
        treatment_id,
        doctor_id,
        medication_name,
        generic_name,
        dosage,
        route,
        frequency,
        duration,
        quantity,
        refills_allowed,
        instructions
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        patientId,
        treatmentId || null,
        req.user.id,
        medicationName,
        genericName || null,
        dosage,
        route || 'oral',
        frequency,
        duration || null,
        quantity || null,
        refillsAllowed,
        instructions || null
      ]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// PUT /prescriptions/:id (SECURED)
// ─────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      medicationName,
      genericName,
      dosage,
      route,
      frequency,
      duration,
      quantity,
      refillsAllowed,
      instructions
    } = req.body;

    const { rows } = await pool.query(
      `
      UPDATE prescriptions rx
      SET medication_name=$1,
          generic_name=$2,
          dosage=$3,
          route=$4,
          frequency=$5,
          duration=$6,
          quantity=$7,
          refills_allowed=$8,
          instructions=$9
      FROM patients p
      WHERE rx.id = $10
        AND rx.patient_id = p.id
        AND p.clinic_id = $11
      RETURNING rx.*
      `,
      [
        medicationName,
        genericName || null,
        dosage,
        route || 'oral',
        frequency,
        duration || null,
        quantity || null,
        refillsAllowed || 0,
        instructions || null,
        req.params.id,
        req.user.clinicId
      ]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// PATCH /dispense (SECURED)
// ─────────────────────────────────────────────
router.patch('/:id/dispense', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      UPDATE prescriptions rx
      SET is_dispensed = TRUE,
          dispensed_at = NOW()
      FROM patients p
      WHERE rx.id = $1
        AND rx.patient_id = p.id
        AND p.clinic_id = $2
      RETURNING rx.*
      `,
      [req.params.id, req.user.clinicId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// DELETE (SOFT DELETE recommended)
// ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM prescriptions rx
      USING patients p
      WHERE rx.id = $1
        AND rx.patient_id = p.id
        AND p.clinic_id = $2
      `,
      [req.params.id, req.user.clinicId]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;