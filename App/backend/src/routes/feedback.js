const express = require('express');
const router = express.Router();
const db = require('../db/pool');

/**
 * GET all feedback
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, limit = 100, offset = 0 } = req.query;

    let baseQuery = `
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN users r ON f.responded_by = r.id
      WHERE 1=1
    `;

    const params = [];
    let i = 1;

    if (type && type !== 'all') {
      baseQuery += ` AND f.type = $${i++}`;
      params.push(type);
    }

    if (status === 'responded') {
      baseQuery += ` AND f.response IS NOT NULL`;
    } else if (status === 'pending') {
      baseQuery += ` AND f.response IS NULL`;
    }

    const dataQuery = `
      SELECT 
        f.*,
        COALESCE(u.full_name, 'Anonymous') as user_name,
        u.email as user_email,
        COALESCE(r.full_name, 'Admin') as responded_by_name
      ${baseQuery}
      ORDER BY f.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `;

    const dataParams = [...params, Number(limit), Number(offset)];

    const countQuery = `
      SELECT COUNT(*) ${baseQuery}
    `;

    const [dataRes, countRes] = await Promise.all([
      db.query(dataQuery, dataParams),
      db.query(countQuery, params),
    ]);

    res.json({
      success: true,
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    console.error('Feedback GET error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback',
    });
  }
});

/**
 * GET stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as responded,
        COUNT(CASE WHEN response IS NULL THEN 1 END) as pending,
        COUNT(rating) as total_ratings,
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_ratings,
        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_ratings
      FROM feedback
    `);

    const s = stats.rows[0];

    const total = Number(s.total);
    const responded = Number(s.responded);
    const totalRatings = Number(s.total_ratings);
    const positive = Number(s.positive_ratings);

    res.json({
      success: true,
      data: {
        total,
        responded,
        pending: total - responded,
        responseRate: total ? Math.round((responded / total) * 100) : 0,
        avgRating: Number(s.avg_rating).toFixed(1),
        satisfactionScore: totalRatings ? Math.round((positive / totalRatings) * 100) : 0,
        positiveRatings: positive,
        negativeRatings: Number(s.negative_ratings),
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: 'Failed stats' });
  }
});

/**
 * GET single feedback
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.*, 
              COALESCE(u.full_name,'Anonymous') as user_name
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * CREATE feedback
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, type, rating, comment } = req.body;

    if (!type || !comment) {
      return res.status(400).json({ error: 'Type + comment required' });
    }

    const result = await db.query(
      `INSERT INTO feedback (user_id, type, rating, comment)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [user_id || null, type, rating || null, comment]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Insert failed' });
  }
});

/**
 * RESPOND
 */
router.post('/:id/respond', async (req, res) => {
  try {
    const { response, respondedBy } = req.body;

    const result = await db.query(
      `UPDATE feedback
       SET response=$1,
           responded_by=$2,
           responded_at=NOW(),
           updated_at=NOW()
       WHERE id=$3
       RETURNING *`,
      [response, respondedBy || null, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Response failed' });
  }
});

/**
 * DELETE
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM feedback WHERE id=$1 RETURNING id`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;