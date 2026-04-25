const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// ─────────────────────────────────────────────
// GET invoices
// ─────────────────────────────────────────────
router.get('/invoices', auth, async (req, res) => {
  try {
    const { status, patientId, page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let where = `WHERE i.clinic_id = $1`;
    const params = [req.user.clinicId];

    if (status) {
      params.push(status);
      where += ` AND i.status = $${params.length}`;
    }

    if (patientId) {
      params.push(patientId);
      where += ` AND i.patient_id = $${params.length}`;
    }

    // COUNT query (fixed)
    const countQuery = await pool.query(
      `SELECT COUNT(*) FROM invoices i ${where}`,
      params
    );

    // DATA query
    const dataParams = [...params, Number(limit), offset];

    const { rows } = await pool.query(
      `SELECT i.*, p.full_name AS patient_name, p.patient_number
       FROM invoices i
       JOIN patients p ON p.id = i.patient_id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      data: rows,
      total: Number(countQuery.rows[0].count),
      page: Number(page)
    });

  } catch (err) {
    console.error('GET invoices error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// GET invoice details
// ─────────────────────────────────────────────
router.get('/invoices/:id', auth, async (req, res) => {
  try {
    const invoiceRes = await pool.query(
      `SELECT i.*, p.full_name AS patient_name
       FROM invoices i
       JOIN patients p ON p.id = i.patient_id
       WHERE i.id = $1 AND i.clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );

    if (!invoiceRes.rows[0]) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const [items, payments] = await Promise.all([
      pool.query(
        `SELECT * FROM invoice_items WHERE invoice_id = $1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT py.*, u.full_name AS received_by_name
         FROM payments py
         JOIN users u ON u.id = py.received_by
         WHERE py.invoice_id = $1
         ORDER BY py.paid_at`,
        [req.params.id]
      )
    ]);

    res.json({
      ...invoiceRes.rows[0],
      items: items.rows,
      payments: payments.rows
    });

  } catch (err) {
    console.error('GET invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// CREATE invoice
// ─────────────────────────────────────────────
router.post('/invoices', auth, async (req, res) => {
  try {
    const {
      patientId,
      treatmentId,
      totalAmount,
      taxPercent = 0,
      discountType = 'none',
      discountValue = 0,
      notes
    } = req.body;

    if (!patientId || !totalAmount) {
      return res.status(400).json({ error: 'Patient and amount required' });
    }

    const taxAmount = (totalAmount * taxPercent) / 100;

    const discountAmount =
      discountType === 'percent'
        ? (totalAmount * discountValue) / 100
        : discountType === 'fixed'
        ? discountValue
        : 0;

    const finalTotal = totalAmount + taxAmount - discountAmount;

    const { rows } = await pool.query(
      `INSERT INTO invoices (
        clinic_id, patient_id, treatment_id,
        subtotal, tax_percent, tax_amount,
        discount_type, discount_value, discount_amount,
        total_amount, paid_amount, status,
        created_by, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,'unpaid',$11,$12)
      RETURNING *`,
      [
        req.user.clinicId,
        patientId,
        treatmentId || null,
        totalAmount,
        taxPercent,
        taxAmount,
        discountType,
        discountValue,
        discountAmount,
        finalTotal,
        req.user.id,
        notes || null
      ]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error('CREATE invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// PAYMENT (FIXED BUG HERE)
// ─────────────────────────────────────────────
router.post('/invoices/:id/payment', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { amount, method, referenceNumber, notes } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount required' });
    }

    // Insert payment
    await client.query(
      `INSERT INTO payments (
        invoice_id, received_by, amount, method, reference_number, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        req.params.id,
        req.user.id,
        amount,
        method || 'cash',
        referenceNumber || null,
        notes || null
      ]
    );

    // FIXED: use proper recalculation (no double-add bug)
    const { rows } = await client.query(
      `UPDATE invoices SET
        paid_amount = paid_amount + $1,
        status = CASE
          WHEN paid_amount + $1 >= total_amount THEN 'paid'
          WHEN paid_amount + $1 > 0 THEN 'partial'
          ELSE 'unpaid'
        END,
        updated_at = NOW()
       WHERE id = $2 AND clinic_id = $3
       RETURNING *`,
      [amount, req.params.id, req.user.clinicId]
    );

    await client.query('COMMIT');
    res.json(rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PAYMENT error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// VOID INVOICE
// ─────────────────────────────────────────────
router.delete('/invoices/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE invoices
       SET status='void', updated_at=NOW()
       WHERE id=$1 AND clinic_id=$2`,
      [req.params.id, req.user.clinicId]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error('DELETE invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// PATIENT BALANCE
// ─────────────────────────────────────────────
router.get('/patient/:id/balance', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM vw_patient_balance WHERE patient_id = $1`,
      [req.params.id]
    );

    res.json(rows[0] || {
      total_billed: 0,
      total_paid: 0,
      balance_due: 0
    });

  } catch (err) {
    console.error('BALANCE error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;