const express = require('express');
const router = express.Router();
const db = require('../db/pool');

/* ============================================================
   PUBLIC ARTICLES
============================================================ */

// GET all published articles
router.get('/articles', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, title, content, category, tags,
        views, helpful_count, author_id,
        created_at, updated_at
      FROM knowledge_articles
      WHERE is_published = true
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles'
    });
  }
});

// GET single article
router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        id, title, content, category, tags,
        views, helpful_count, author_id,
        created_at, updated_at
      FROM knowledge_articles
      WHERE id = $1 AND is_published = true
    `, [id]);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article'
    });
  }
});

// increment views
router.post('/articles/:id/views', async (req, res) => {
  try {
    await db.query(`
      UPDATE knowledge_articles
      SET views = views + 1
      WHERE id = $1 AND is_published = true
    `, [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// mark helpful
router.post('/articles/:id/helpful', async (req, res) => {
  try {
    await db.query(`
      UPDATE knowledge_articles
      SET helpful_count = helpful_count + 1
      WHERE id = $1 AND is_published = true
    `, [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

/* ============================================================
   ADMIN (⚠ should later add auth middleware)
============================================================ */

// GET all articles (admin)
router.get('/admin/articles', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM knowledge_articles
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// CREATE article
router.post('/admin/articles', async (req, res) => {
  try {
    const { title, content, category, tags, authorId } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content required'
      });
    }

    const result = await db.query(`
      INSERT INTO knowledge_articles
      (title, content, category, tags, author_id, is_published)
      VALUES ($1,$2,$3,$4,$5,true)
      RETURNING *
    `, [title, content, category, tags || '', authorId || null]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// UPDATE article
router.put('/admin/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, is_published } = req.body;

    const result = await db.query(`
      UPDATE knowledge_articles
      SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        category = COALESCE($3, category),
        tags = COALESCE($4, tags),
        is_published = COALESCE($5, is_published),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [title, content, category, tags, is_published, id]);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// DELETE article
router.delete('/admin/articles/:id', async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM knowledge_articles
      WHERE id = $1
      RETURNING id
    `, [req.params.id]);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;