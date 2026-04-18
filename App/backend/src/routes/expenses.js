const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

/**
 * GET expenses
 */
router.get('/', auth, async (req, res) => {
  try {
    const { category, from, to, page = 1, limit = 50 } = req.query;

    const params = [req.user.clinicId];
    let where = `e.clinic_id = $1`;

    if (category) {
      params.push(category);
      where += ` AND e.category = $${params.length}`;
    }

    if (from) {
      params.push(from);
      where += ` AND e.expense_date >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      where += ` AND e.expense_date <= $${params.length}`;
    }

    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT e.*, u.full_name AS recorded_by_name
      FROM expenses e
      LEFT JOIN users u ON e.recorded_by = u.id
      WHERE ${where}
      ORDER BY e.expense_date DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) AS count,
             COALESCE(SUM(e.amount),0) AS total
      FROM expenses e
      WHERE ${where}
    `;

    const [data, count] = await Promise.all([
      pool.query(dataQuery, [...params, limit, offset]),
      pool.query(countQuery, params),
    ]);

    res.json({
      data: data.rows,
      total: Number(count.rows[0].count),
      totalAmount: Number(count.rows[0].total),
    });
  } catch (err) {
    console.error('Expenses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * SUMMARY
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    const [cat, month, total] = await Promise.all([
      pool.query(
        `SELECT category, SUM(amount) AS total
         FROM expenses
         WHERE clinic_id=$1
         GROUP BY category
         ORDER BY total DESC`,
        [clinicId]
      ),
      pool.query(
        `SELECT TO_CHAR(expense_date,'Mon YYYY') AS month,
                SUM(amount) AS total
         FROM expenses
         WHERE clinic_id=$1
         GROUP BY month, DATE_TRUNC('month', expense_date)
         ORDER BY DATE_TRUNC('month', expense_date) DESC
         LIMIT 12`,
        [clinicId]
      ),
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
         FROM expenses
         WHERE clinic_id=$1`,
        [clinicId]
      ),
    ]);

    res.json({
      total: Number(total.rows[0].total),
      count: Number(total.rows[0].count),
      by_category: cat.rows,
      by_month: month.rows,
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * CREATE
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      category,
      description,
      amount,
      paymentMethod,
      reference,
      expenseDate,
      notes,
    } = req.body;

    if (!category || !description || !amount) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const result = await pool.query(
      `INSERT INTO expenses
       (clinic_id, recorded_by, category, description, amount,
        payment_method, reference, expense_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.clinicId,
        req.user.id,
        category,
        description,
        amount,
        paymentMethod || 'cash',
        reference || null,
        expenseDate || new Date(),
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * UPDATE
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE expenses
       SET category=$1,
           description=$2,
           amount=$3,
           payment_method=$4,
           reference=$5,
           expense_date=$6,
           notes=$7
       WHERE id=$8 AND clinic_id=$9
       RETURNING *`,
      [
        req.body.category,
        req.body.description,
        req.body.amount,
        req.body.paymentMethod,
        req.body.reference,
        req.body.expenseDate,
        req.body.notes,
        req.params.id,
        req.user.clinicId,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * DELETE
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM expenses WHERE id=$1 AND clinic_id=$2 RETURNING id`,
      [req.params.id, req.user.clinicId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;