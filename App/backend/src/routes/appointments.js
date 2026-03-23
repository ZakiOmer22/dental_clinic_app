const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

const APPT_SELECT = `
  SELECT a.*, 
    p.full_name  AS patient_name,
    p.phone      AS patient_phone,
    p.id         AS patient_id,
    u.full_name  AS doctor_name,
    r.name       AS room_name
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  JOIN users    u ON a.doctor_id  = u.id
  LEFT JOIN rooms r ON a.room_id  = r.id
`;

// GET /appointments/today  (must come before /:id)
router.get('/today', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${APPT_SELECT}
       WHERE a.clinic_id = $1 AND DATE(a.scheduled_at) = CURRENT_DATE
       ORDER BY a.scheduled_at`,
      [req.user.clinicId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /appointments
router.get('/', auth, async (req, res) => {
  try {
    const { status, date, doctor, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [req.user.clinicId];
    let where = 'WHERE a.clinic_id = $1';

    if (status) { params.push(status); where += ` AND a.status = $${params.length}`; }
    if (date)   { params.push(date);   where += ` AND DATE(a.scheduled_at) = $${params.length}`; }
    if (doctor) { params.push(doctor); where += ` AND a.doctor_id = $${params.length}`; }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM appointments a ${where}`, params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(Number(limit), offset);
    const { rows } = await pool.query(
      `${APPT_SELECT} ${where}
       ORDER BY a.scheduled_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total, page: Number(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /appointments
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, doctorId, roomId, scheduledAt, durationMinutes, type, chiefComplaint, notes } = req.body;
    if (!patientId || !scheduledAt) return res.status(400).json({ error: 'Patient and time required' });

    const { rows } = await pool.query(
      `INSERT INTO appointments
         (clinic_id, patient_id, doctor_id, room_id, scheduled_at, duration_minutes,
          type, chief_complaint, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [req.user.clinicId, patientId, doctorId || req.user.id, roomId || null,
       scheduledAt, durationMinutes || 30, type || 'checkup',
       chiefComplaint || null, notes || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /appointments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { scheduledAt, durationMinutes, type, chiefComplaint, notes, roomId, doctorId } = req.body;
    const { rows } = await pool.query(
      `UPDATE appointments SET
         scheduled_at=$1, duration_minutes=$2, type=$3, chief_complaint=$4,
         notes=$5, room_id=$6, doctor_id=$7, updated_at=NOW()
       WHERE id=$8 AND clinic_id=$9
       RETURNING *`,
      [scheduledAt, durationMinutes || 30, type, chiefComplaint || null,
       notes || null, roomId || null, doctorId, req.params.id, req.user.clinicId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Appointment not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /appointments/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['scheduled','confirmed','in_progress','completed','cancelled','no_show','rescheduled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const { rows } = await pool.query(
      `UPDATE appointments SET status=$1, updated_at=NOW()
       WHERE id=$2 AND clinic_id=$3 RETURNING *`,
      [status, req.params.id, req.user.clinicId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Appointment not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /appointments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM appointments WHERE id=$1 AND clinic_id=$2',
      [req.params.id, req.user.clinicId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
