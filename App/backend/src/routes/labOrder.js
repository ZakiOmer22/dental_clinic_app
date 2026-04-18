const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

/* ============================================================
   GET ALL LAB ORDERS
============================================================ */

router.get('/', auth, async (req, res) => {
  try {
    const { status, patientId, page = 1, limit = 50 } = req.query;

    let where = `WHERE lo.clinic_id=$1`;
    const params = [req.user.clinicId];

    if (status) {
      params.push(status);
      where += ` AND lo.status=$${params.length}`;
    }

    if (patientId) {
      params.push(patientId);
      where += ` AND lo.patient_id=$${params.length}`;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await pool.query(
      `SELECT lo.*,
              p.full_name AS patient_name,
              p.patient_number,
              u.full_name AS doctor_name
       FROM lab_orders lo
       JOIN patients p ON lo.patient_id = p.id
       JOIN users u ON lo.doctor_id = u.id
       ${where}
       ORDER BY lo.created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*)
       FROM lab_orders lo
       ${where}`,
      params
    );

    res.json({
      data: rows,
      total: Number(countRes.rows[0].count)
    });

  } catch (err) {
    console.error('GET labOrders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ============================================================
   GET SINGLE ORDER
============================================================ */

router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT lo.*,
              p.full_name AS patient_name,
              u.full_name AS doctor_name
       FROM lab_orders lo
       JOIN patients p ON lo.patient_id=p.id
       JOIN users u ON lo.doctor_id=u.id
       WHERE lo.id=$1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   CREATE LAB ORDER
============================================================ */

router.post('/', auth, async (req, res) => {
  try {
    const {
      patientId,
      treatmentId,
      orderType,
      shade,
      labName,
      instructions,
      sentDate,
      expectedDate,
      cost = 0
    } = req.body;

    if (!patientId || !orderType) {
      return res.status(400).json({
        error: 'patientId and orderType required'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO lab_orders
       (clinic_id, patient_id, treatment_id, doctor_id,
        order_type, shade, lab_name, instructions,
        sent_date, expected_date, cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        req.user.clinicId,
        patientId,
        treatmentId || null,
        req.user.id,
        orderType,
        shade || null,
        labName || null,
        instructions || null,
        sentDate || null,
        expectedDate || null,
        cost
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   UPDATE ORDER
============================================================ */

router.put('/:id', auth, async (req, res) => {
  try {
    const {
      orderType,
      shade,
      labName,
      instructions,
      sentDate,
      expectedDate,
      receivedDate,
      status,
      cost,
      notes
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE lab_orders SET
        order_type=$1,
        shade=$2,
        lab_name=$3,
        instructions=$4,
        sent_date=$5,
        expected_date=$6,
        received_date=$7,
        status=$8,
        cost=$9,
        notes=$10
       WHERE id=$11
       RETURNING *`,
      [
        orderType,
        shade || null,
        labName || null,
        instructions || null,
        sentDate || null,
        expectedDate || null,
        receivedDate || null,
        status || 'pending',
        cost || 0,
        notes || null,
        req.params.id
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   DELETE ORDER
============================================================ */

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM lab_orders WHERE id=$1`,
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;