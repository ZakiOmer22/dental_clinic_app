const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');


// ─────────────────────────────────────────────
// GET /patients/search
// ─────────────────────────────────────────────
router.get('/search', auth, async (req, res) => {
  try {
    const { q = '' } = req.query;
    const clinicId = req.user.clinicId;

    if (!q.trim()) {
      return res.json({ data: [], total: 0 });
    }

    const searchTerm = `%${q.trim()}%`;

    const { rows } = await pool.query(
      `
      SELECT id, patient_number, full_name, phone, email,
             gender, date_of_birth, blood_type, address, city, created_at
      FROM patients
      WHERE clinic_id = $1
        AND is_active = TRUE
        AND (
          full_name ILIKE $2 OR
          phone ILIKE $2 OR
          email ILIKE $2 OR
          patient_number ILIKE $2 OR
          id::text = $3
        )
      ORDER BY full_name ASC
      LIMIT 20
      `,
      [clinicId, searchTerm, req.query.q]
    );

    res.json({
      data: rows,
      total: rows.length,
      query: q
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});


// ─────────────────────────────────────────────
// GET /patients (LIST + SEARCH + PAGINATION)
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const clinicId = req.user.clinicId;

    let where = `WHERE clinic_id = $1 AND is_active = TRUE`;
    const params = [clinicId];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (
        full_name ILIKE $2 OR
        phone ILIKE $2 OR
        patient_number ILIKE $2
      )`;
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM patients ${where}`,
      params
    );

    params.push(Number(limit), offset);

    const { rows } = await pool.query(
      `
      SELECT id, patient_number, full_name, phone, email,
             gender, date_of_birth, blood_type,
             address, city, created_at
      FROM patients
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
      `,
      params
    );

    res.json({
      data: rows,
      total: Number(count.rows[0].count),
      page: Number(page),
      limit: Number(limit)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// GET /patients/:id (SECURED)
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM patients
      WHERE id = $1 AND clinic_id = $2
      `,
      [req.params.id, req.user.clinicId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = rows[0];

    const [allergies, conditions, emergency, insurance] = await Promise.all([
      pool.query(
        `SELECT * FROM allergies WHERE patient_id = $1`,
        [patient.id]
      ).catch(() => ({ rows: [] })),

      pool.query(
        `SELECT * FROM medical_conditions WHERE patient_id = $1`,
        [patient.id]
      ).catch(() => ({ rows: [] })),

      pool.query(
        `SELECT * FROM emergency_contacts WHERE patient_id = $1 ORDER BY is_primary DESC`,
        [patient.id]
      ).catch(() => ({ rows: [] })),

      pool.query(
        `SELECT * FROM insurance_policies WHERE patient_id = $1 AND is_active = TRUE`,
        [patient.id]
      ).catch(() => ({ rows: [] })),
    ]);

    res.json({
      ...patient,
      allergies: allergies.rows,
      medical_conditions: conditions.rows,
      emergency_contacts: emergency.rows,
      insurance_policies: insurance.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// POST /patients
// ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const {
      fullName, phone, email, gender,
      dateOfBirth, bloodType, address, city,
      occupation, nationalId, notes
    } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Name and phone required' });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO patients (
        clinic_id, full_name, phone, email, gender,
        date_of_birth, blood_type, address, city,
        occupation, national_id, notes, created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
      `,
      [
        req.user.clinicId,
        fullName,
        phone,
        email || null,
        gender || null,
        dateOfBirth || null,
        bloodType || null,
        address || null,
        city || null,
        occupation || null,
        nationalId || null,
        notes || null,
        req.user.id
      ]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// PUT /patients/:id
// ─────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      fullName, phone, email, gender,
      dateOfBirth, bloodType, address,
      city, occupation, nationalId, notes
    } = req.body;

    const { rows } = await pool.query(
      `
      UPDATE patients
      SET full_name=$1,
          phone=$2,
          email=$3,
          gender=$4,
          date_of_birth=$5,
          blood_type=$6,
          address=$7,
          city=$8,
          occupation=$9,
          national_id=$10,
          notes=$11,
          updated_at=NOW()
      WHERE id=$12 AND clinic_id=$13
      RETURNING *
      `,
      [
        fullName,
        phone,
        email || null,
        gender || null,
        dateOfBirth || null,
        bloodType || null,
        address || null,
        city || null,
        occupation || null,
        nationalId || null,
        notes || null,
        req.params.id,
        req.user.clinicId
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// DELETE (SOFT DELETE)
// ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `
      UPDATE patients
      SET is_active = FALSE,
          updated_at = NOW()
      WHERE id = $1 AND clinic_id = $2
      `,
      [req.params.id, req.user.clinicId]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────
router.get('/:id/history', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT a.id, a.scheduled_at, a.type, a.status,
             a.chief_complaint, u.full_name AS doctor_name
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE a.patient_id = $1
        AND a.clinic_id = $2
      ORDER BY a.scheduled_at DESC
      `,
      [req.params.id, req.user.clinicId]
    );

    res.json({ visits: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// BALANCE (FIXED SECURITY)
// ─────────────────────────────────────────────
router.get('/:id/balance', auth, async (req, res) => {
  try {
    const invoices = await pool.query(
      `
      SELECT i.*
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.patient_id = $1
        AND p.clinic_id = $2
      `,
      [req.params.id, req.user.clinicId]
    );

    const totalBilled = invoices.rows.reduce(
      (s, i) => s + Number(i.total_amount || 0),
      0
    );

    const totalPaid = invoices.rows.reduce(
      (s, i) => s + Number(i.paid_amount || 0),
      0
    );

    res.json({
      total_billed: totalBilled,
      total_paid: totalPaid,
      balance_due: totalBilled - totalPaid,
      invoices: invoices.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// FILES (SECURED)
// ─────────────────────────────────────────────
router.get('/:id/files', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT pf.*, u.full_name AS uploaded_by_name
      FROM patient_files pf
      JOIN users u ON pf.uploaded_by = u.id
      JOIN patients p ON pf.patient_id = p.id
      WHERE pf.patient_id = $1
        AND p.clinic_id = $2
        AND pf.is_archived = FALSE
      ORDER BY pf.uploaded_at DESC
      `,
      [req.params.id, req.user.clinicId]
    );

    res.json({ data: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ─────────────────────────────────────────────
// CHART (SECURED)
// ─────────────────────────────────────────────
router.get('/:id/chart', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT dc.*, u.full_name AS recorded_by_name
      FROM dental_chart dc
      JOIN patients p ON dc.patient_id = p.id
      LEFT JOIN users u ON dc.recorded_by = u.id
      WHERE dc.patient_id = $1
        AND p.clinic_id = $2
      ORDER BY dc.tooth_number
      `,
      [req.params.id, req.user.clinicId]
    );

    res.json({ data: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;