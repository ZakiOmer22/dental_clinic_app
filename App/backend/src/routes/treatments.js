const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /treatments
router.get('/', auth, async (req, res) => {
  try {
    const { patientId, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [req.user.clinicId];
    let join  = 'JOIN patients p ON t.patient_id = p.id JOIN users u ON t.doctor_id = u.id';
    let where = 'WHERE p.clinic_id = $1';

    if (patientId) { params.push(patientId); where += ` AND t.patient_id = $${params.length}`; }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM treatments t ${join} ${where}`, params
    );
    params.push(Number(limit), offset);

    const { rows } = await pool.query(
      `SELECT t.*,
         p.full_name AS patient_name,
         u.full_name AS doctor_name,
         COALESCE((
           SELECT SUM(tp.price_charged)
           FROM treatment_procedures tp WHERE tp.treatment_id = t.id
         ), 0) AS total_cost
       FROM treatments t ${join} ${where}
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /treatments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, p.full_name AS patient_name, u.full_name AS doctor_name
       FROM treatments t
       JOIN patients p ON t.patient_id = p.id
       JOIN users    u ON t.doctor_id  = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Treatment not found' });

    const [procs, prescriptions, labOrders] = await Promise.all([
      pool.query(
        `SELECT tp.*, pr.name AS procedure_name, pr.cdt_code
         FROM treatment_procedures tp
         JOIN procedures pr ON tp.procedure_id = pr.id
         WHERE tp.treatment_id = $1`,
        [req.params.id]
      ),
      pool.query('SELECT * FROM prescriptions WHERE treatment_id = $1', [req.params.id]),
      pool.query('SELECT * FROM lab_orders WHERE treatment_id = $1', [req.params.id]),
    ]);

    res.json({
      ...rows[0],
      procedures:    procs.rows,
      prescriptions: prescriptions.rows,
      lab_orders:    labOrders.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /treatments
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { patientId, appointmentId, diagnosis, chiefComplaint, treatmentNotes, followUpDate, procedures = [] } = req.body;

    if (!patientId || !diagnosis) return res.status(400).json({ error: 'Patient and diagnosis required' });

    const { rows } = await client.query(
      `INSERT INTO treatments
         (patient_id, doctor_id, appointment_id, chief_complaint, diagnosis,
          treatment_notes, follow_up_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [patientId, req.user.id, appointmentId || null, chiefComplaint || null,
       diagnosis, treatmentNotes || null, followUpDate || null]
    );

    const treatment = rows[0];

    // Insert CDT procedure line items
    for (const proc of procedures) {
      await client.query(
        `INSERT INTO treatment_procedures
           (treatment_id, procedure_id, tooth_number, price_charged, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [treatment.id, proc.procedureId, proc.toothNumber || null,
         proc.price || 0, proc.notes || null]
      );
    }

    // Mark appointment as completed if linked
    if (appointmentId) {
      await client.query(
        `UPDATE appointments SET status='completed', updated_at=NOW() WHERE id=$1`,
        [appointmentId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(treatment);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /treatments/:id/procedures  (add CDT line item)
router.post('/:id/procedures', auth, async (req, res) => {
  try {
    const { procedureId, toothNumber, surface, price, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO treatment_procedures
         (treatment_id, procedure_id, tooth_number, surface, price_charged, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, procedureId, toothNumber || null, surface || null, price || 0, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /treatments/:id/prescriptions
router.post('/:id/prescriptions', auth, async (req, res) => {
  try {
    const { patientId, medicationName, dosage, frequency, duration, instructions, quantity } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO prescriptions
         (treatment_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.id, patientId, req.user.id, medicationName, dosage, frequency,
       duration || null, instructions || null, quantity || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /treatments/:id/lab-orders
router.post('/:id/lab-orders', auth, async (req, res) => {
  try {
    const { patientId, labName, orderType, shade, instructions, expectedDate } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO lab_orders
         (treatment_id, patient_id, doctor_id, lab_name, order_type, shade, instructions, expected_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, patientId, req.user.id, labName || null, orderType,
       shade || null, instructions || null, expectedDate || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /procedures  (CDT catalog — for the frontend picker)
router.get('/catalog/procedures', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, cdt_code, category, base_price, duration_minutes
       FROM procedures WHERE clinic_id = $1 AND is_active = TRUE
       ORDER BY category, name`,
      [req.user.clinicId]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
