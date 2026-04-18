const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// ========================
// GET ALL TREATMENTS
// ========================
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    const params = [req.user.clinicId];
    let where = `WHERE p.clinic_id = $1`;

    if (req.query.patientId) {
      params.push(req.query.patientId);
      where += ` AND t.patient_id = $${params.length}`;
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM treatments t
       JOIN patients p ON t.patient_id = p.id
       ${where}`,
      params
    );

    const total = parseInt(count.rows[0].count || 0);

    const { rows } = await pool.query(
      `SELECT t.*,
        p.full_name AS patient_name,
        u.full_name AS doctor_name,
        COALESCE((
          SELECT SUM(tp.price_charged)
          FROM treatment_procedures tp
          WHERE tp.treatment_id = t.id
        ),0) AS total_cost
       FROM treatments t
       JOIN patients p ON t.patient_id = p.id
       JOIN users u ON t.doctor_id = u.id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ data: rows, total, page, limit });

  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// GET SINGLE
// ========================
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, p.full_name AS patient_name, u.full_name AS doctor_name
       FROM treatments t
       JOIN patients p ON t.patient_id = p.id
       JOIN users u ON t.doctor_id = u.id
       WHERE t.id = $1 AND p.clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const [procs, rx, labs] = await Promise.all([
      pool.query(
        `SELECT * FROM treatment_procedures WHERE treatment_id=$1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT * FROM prescriptions WHERE treatment_id=$1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT * FROM lab_orders WHERE treatment_id=$1`,
        [req.params.id]
      )
    ]);

    res.json({
      ...rows[0],
      procedures: procs.rows,
      prescriptions: rx.rows,
      lab_orders: labs.rows
    });

  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================
// CREATE TREATMENT
// ========================
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      patientId,
      appointmentId,
      diagnosis,
      chiefComplaint,
      treatmentNotes,
      followUpDate,
      procedures = []
    } = req.body;

    if (!patientId || !diagnosis) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { rows } = await client.query(
      `INSERT INTO treatments
       (patient_id, doctor_id, appointment_id, chief_complaint, diagnosis,
        treatment_notes, follow_up_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [patientId, req.user.id, appointmentId || null,
       chiefComplaint || null, diagnosis, treatmentNotes || null, followUpDate || null]
    );

    const treatment = rows[0];

    for (const p of procedures) {
      await client.query(
        `INSERT INTO treatment_procedures
         (treatment_id, procedure_id, tooth_number, price_charged, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [treatment.id, p.procedureId, p.toothNumber || null, p.price || 0, p.notes || null]
      );
    }

    await client.query('COMMIT');

    res.status(201).json(treatment);

  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;