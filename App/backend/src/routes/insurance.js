const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// SQL template
const CLAIM_SELECT = `
  SELECT 
    c.id,
    c.claim_number,
    c.patient_id,
    pt.full_name AS patient_name,
    c.invoice_id,
    i.invoice_number,
    c.insurance_policy_id,
    ip.provider_name,
    ip.policy_number,
    c.submission_date,
    c.total_amount,
    c.covered_amount,
    c.deductible,
    c.copay,
    c.status,
    c.notes,
    c.created_by,
    c.created_at,
    c.updated_at
  FROM insurance_claims c
  JOIN patients pt ON c.patient_id = pt.id
  LEFT JOIN invoices i ON c.invoice_id = i.id
  LEFT JOIN insurance_policies ip ON c.insurance_policy_id = ip.id
`;

// GET claims
router.get('/claims', auth, async (req, res) => {
  try {
    const { patientId, status, fromDate, toDate, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const params = [req.user.clinicId];
    let where = 'WHERE c.clinic_id = $1';

    if (patientId) {
      params.push(patientId);
      where += ` AND c.patient_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      where += ` AND c.status = $${params.length}`;
    }

    if (fromDate) {
      params.push(fromDate);
      where += ` AND c.submission_date >= $${params.length}`;
    }

    if (toDate) {
      params.push(toDate);
      where += ` AND c.submission_date <= $${params.length}`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM insurance_claims c ${where}`,
      params
    );

    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, Number(limit), offset];

    const { rows } = await pool.query(
      `${CLAIM_SELECT} ${where}
       ORDER BY c.submission_date DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({ data: rows, total, page: Number(page) });

  } catch (err) {
    console.error('GET claims error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST claim
router.post('/claims', auth, async (req, res) => {
  try {
    const {
      patientId,
      invoiceId,
      insurancePolicyId,
      submissionDate,
      totalAmount,
      coveredAmount,
      deductible,
      copay,
      notes
    } = req.body;

    if (!patientId || !invoiceId) {
      return res.status(400).json({ error: 'Patient and invoice required' });
    }

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM insurance_claims WHERE clinic_id=$1`,
      [req.user.clinicId]
    );

    const claimNumber =
      `CLM-${new Date().getFullYear()}-${String(Number(countRows[0].count) + 1).padStart(4, '0')}`;

    const { rows } = await pool.query(
      `INSERT INTO insurance_claims
       (clinic_id, claim_number, patient_id, invoice_id, insurance_policy_id,
        submission_date, total_amount, covered_amount, deductible, copay,
        status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.clinicId,
        claimNumber,
        patientId,
        invoiceId,
        insurancePolicyId || null,
        submissionDate || new Date().toISOString().split('T')[0],
        totalAmount,
        coveredAmount || 0,
        deductible || 0,
        copay || 0,
        'draft',
        notes || null,
        req.user.id
      ]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error('POST claim error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT claim (draft only)
router.put('/claims/:id', auth, async (req, res) => {
  try {
    const { coveredAmount, deductible, copay, notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE insurance_claims SET
       covered_amount = COALESCE($1, covered_amount),
       deductible = COALESCE($2, deductible),
       copay = COALESCE($3, copay),
       notes = COALESCE($4, notes),
       updated_at = NOW()
       WHERE id=$5 AND clinic_id=$6 AND status='draft'
       RETURNING *`,
      [coveredAmount, deductible, copay, notes, req.params.id, req.user.clinicId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Claim not found' });

    res.json(rows[0]);

  } catch (err) {
    console.error('PUT claim error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// submit claim
router.patch('/claims/:id/submit', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE insurance_claims SET
       status='submitted',
       submitted_at=NOW(),
       updated_at=NOW()
       WHERE id=$1 AND clinic_id=$2 AND status='draft'
       RETURNING *`,
      [req.params.id, req.user.clinicId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Claim not found' });

    res.json(rows[0]);

  } catch (err) {
    console.error('PATCH submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// delete claim
router.delete('/claims/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM insurance_claims
       WHERE id=$1 AND clinic_id=$2 AND status='draft'`,
      [req.params.id, req.user.clinicId]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error('DELETE claim error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;