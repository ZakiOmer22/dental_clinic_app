const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

/* ─────────────────────────────────────────────
   GET /procedures
──────────────────────────────────────────── */
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, is_active, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const params = [req.user.clinicId];
    let whereClause = 'WHERE clinic_id = $1';

    if (is_active === 'true') {
      whereClause += ' AND is_active = true';
    } else if (is_active === 'false') {
      whereClause += ' AND is_active = false';
    } else {
      whereClause += ' AND is_active = true';
    }

    if (category && category !== 'all') {
      params.push(category);
      whereClause += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR cdt_code ILIKE $${params.length})`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM procedures ${whereClause}`,
      params
    );

    const total = parseInt(countRes.rows[0].count);

    params.push(Number(limit), offset);

    const { rows } = await pool.query(
      `SELECT id, name, cdt_code, category, base_price,
              duration_minutes, description,
              requires_lab, is_active, created_at
       FROM procedures
       ${whereClause}
       ORDER BY category, name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: rows,
      total,
      page: Number(page),
      limit: Number(limit)
    });

  } catch (err) {
    console.error('Error fetching procedures:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─────────────────────────────────────────────
   GET /procedures/categories
──────────────────────────────────────────── */
router.get('/categories', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT category
       FROM procedures
       WHERE clinic_id = $1 AND is_active = true
       ORDER BY category`,
      [req.user.clinicId]
    );

    res.json(rows.map(r => r.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─────────────────────────────────────────────
   GET /procedures/category/:category
──────────────────────────────────────────── */
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, cdt_code, category, base_price,
              duration_minutes, description, requires_lab
       FROM procedures
       WHERE clinic_id = $1 AND category = $2 AND is_active = true
       ORDER BY name`,
      [req.user.clinicId, req.params.category]
    );

    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─────────────────────────────────────────────
   GET /procedures/stats/summary
──────────────────────────────────────────── */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT COUNT(*) as total_procedures,
              COUNT(DISTINCT category) as total_categories,
              AVG(base_price) as avg_price,
              MIN(base_price) as min_price,
              MAX(base_price) as max_price,
              COUNT(CASE WHEN requires_lab THEN 1 END) as lab_required_count
       FROM procedures
       WHERE clinic_id = $1 AND is_active = true`,
      [req.user.clinicId]
    );

    const categoryBreakdown = await pool.query(
      `SELECT category,
              COUNT(*) as count,
              AVG(base_price) as avg_category_price
       FROM procedures
       WHERE clinic_id = $1 AND is_active = true
       GROUP BY category
       ORDER BY count DESC`,
      [req.user.clinicId]
    );

    res.json({
      summary: stats.rows[0],
      byCategory: categoryBreakdown.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─────────────────────────────────────────────
   GET /procedures/:id  (MUST BE LAST)
──────────────────────────────────────────── */
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, cdt_code, category, base_price,
              duration_minutes, description,
              requires_lab, is_active
       FROM procedures
       WHERE id = $1 AND clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Procedure not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─────────────────────────────────────────────
   IMPORTANT: EXPORT MUST BE A FUNCTION
──────────────────────────────────────────── */
module.exports = router;