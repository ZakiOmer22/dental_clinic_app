const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /expenses
router.get('/', auth, async (req, res) => {
  try {
    const { category, from, to, page = 1, limit = 50 } = req.query;
    const params = [req.user.clinicId];

    // prefix every bare column with e. — the JOIN with users causes ambiguity on clinic_id
    let where = 'e.clinic_id = $1';
    if (category) { params.push(category); where += ` AND e.category = $${params.length}`; }
    if (from)     { params.push(from);     where += ` AND e.expense_date >= $${params.length}`; }
    if (to)       { params.push(to);       where += ` AND e.expense_date <= $${params.length}`; }

    const dataParams  = [...params, Number(limit), (Number(page) - 1) * Number(limit)];
    const countParams = [...params]; // no LIMIT/OFFSET for COUNT

    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT e.*, u.full_name AS recorded_by_name
         FROM expenses e
         LEFT JOIN users u ON e.recorded_by = u.id
         WHERE ${where}
         ORDER BY e.expense_date DESC
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      ),
      pool.query(
        `SELECT COUNT(*), COALESCE(SUM(e.amount), 0) AS total
         FROM expenses e
         WHERE ${where}`,
        countParams
      ),
    ]);

    res.json({
      data:        rows.rows,
      total:       Number(count.rows[0].count),
      totalAmount: count.rows[0].total,
    });
  } catch (err) {
    console.error('GET /expenses error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /expenses/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const [byCategory, byMonth, overall] = await Promise.all([
      pool.query(
        `SELECT e.category, SUM(e.amount) AS total
         FROM expenses e
         WHERE e.clinic_id = $1
         GROUP BY e.category
         ORDER BY total DESC`,
        [req.user.clinicId]
      ),
      pool.query(
        `SELECT TO_CHAR(e.expense_date, 'Mon YYYY') AS month, SUM(e.amount) AS total
         FROM expenses e
         WHERE e.clinic_id = $1
         GROUP BY TO_CHAR(e.expense_date, 'Mon YYYY'), DATE_TRUNC('month', e.expense_date)
         ORDER BY DATE_TRUNC('month', e.expense_date) DESC
         LIMIT 12`,
        [req.user.clinicId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(e.amount), 0) AS total, COUNT(*) AS count
         FROM expenses e
         WHERE e.clinic_id = $1`,
        [req.user.clinicId]
      ),
    ]);

    res.json({
      total:       overall.rows[0].total,
      count:       overall.rows[0].count,
      by_category: byCategory.rows,
      by_month:    byMonth.rows,
    });
  } catch (err) {
    console.error('GET /expenses/summary error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /expenses
router.post('/', auth, async (req, res) => {
  try {
    const {
      category, description, amount,
      paymentMethod, reference, expenseDate, notes,
    } = req.body;

    if (!category || !description || !amount) {
      return res.status(400).json({ error: 'category, description and amount required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO expenses
         (clinic_id, recorded_by, category, description, amount,
          payment_method, reference, expense_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.clinicId,
        req.user.id,
        category,
        description,
        amount,
        paymentMethod || 'cash',
        reference     || null,
        expenseDate   || new Date().toISOString().slice(0, 10),
        notes         || null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /expenses error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /expenses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      category, description, amount,
      paymentMethod, reference, expenseDate, notes,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE expenses
       SET category       = $1,
           description    = $2,
           amount         = $3,
           payment_method = $4,
           reference      = $5,
           expense_date   = $6,
           notes          = $7
       WHERE id = $8 AND clinic_id = $9
       RETURNING *`,
      [
        category,
        description,
        amount,
        paymentMethod || 'cash',
        reference     || null,
        expenseDate,
        notes         || null,
        req.params.id,
        req.user.clinicId,
      ]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Expense not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /expenses/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND clinic_id = $2',
      [req.params.id, req.user.clinicId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Expense not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /expenses/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;