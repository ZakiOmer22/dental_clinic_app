// backend/routes/knowledgeBase.js
const express = require('express');
const router = express.Router();

const db = require('../db/pool');

// GET all published articles
router.get('/articles', async (req, res) => {
    try {
        console.log('Fetching all articles...');
        
        const result = await db.query(`
            SELECT 
                id, 
                title, 
                content, 
                category, 
                tags, 
                views, 
                helpful_count,
                author_id,
                created_at,
                updated_at
            FROM knowledge_articles 
            WHERE is_published = true
            ORDER BY created_at DESC
        `);
        
        console.log(`Found ${result.rows.length} articles`);
        
        res.json({ 
            success: true, 
            data: result.rows,
            total: result.rows.length 
        });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch articles',
            details: error.message 
        });
    }
});

// GET single article by ID
router.get('/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT 
                id, 
                title, 
                content, 
                category, 
                tags, 
                views, 
                helpful_count,
                author_id,
                created_at,
                updated_at
            FROM knowledge_articles 
            WHERE id = $1 AND is_published = true
        `, [id]);
        
        if (result.rows.length === 0) {
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

// POST increment view count
router.post('/articles/:id/views', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(`
            UPDATE knowledge_articles
            SET views = views + 1
            WHERE id = $1 AND is_published = true
        `, [id]);
        
        res.json({ 
            success: true, 
            message: 'View count updated' 
        });
    } catch (error) {
        console.error('Error updating views:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update view count' 
        });
    }
});

// POST mark as helpful
router.post('/articles/:id/helpful', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(`
            UPDATE knowledge_articles
            SET helpful_count = helpful_count + 1
            WHERE id = $1 AND is_published = true
        `, [id]);
        
        res.json({ 
            success: true, 
            message: 'Marked as helpful' 
        });
    } catch (error) {
        console.error('Error marking helpful:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to mark as helpful' 
        });
    }
});

// ============================================================
// ADMIN ONLY ENDPOINTS (These should have auth middleware)
// ============================================================

// GET all articles for admin (including unpublished)
router.get('/admin/articles', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, 
                title, 
                content, 
                category, 
                tags, 
                views, 
                helpful_count,
                author_id,
                is_published,
                created_at,
                updated_at
            FROM knowledge_articles 
            ORDER BY created_at DESC
        `);
        
        res.json({ 
            success: true, 
            data: result.rows,
            total: result.rows.length 
        });
    } catch (error) {
        console.error('Error fetching admin articles:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch articles' 
        });
    }
});

// POST create article (admin only)
router.post('/admin/articles', async (req, res) => {
    try {
        const { title, content, category, tags, authorId } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ 
                success: false, 
                error: 'Title and content are required' 
            });
        }
        
        const result = await db.query(`
            INSERT INTO knowledge_articles (title, content, category, tags, author_id, is_published)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING *
        `, [title, content, category, tags || '', authorId || null]);
        
        res.status(201).json({ 
            success: true, 
            data: result.rows[0] 
        });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create article' 
        });
    }
});

// PUT update article (admin only)
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
        
        if (result.rows.length === 0) {
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
        console.error('Error updating article:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update article' 
        });
    }
});

// DELETE article (admin only)
router.delete('/admin/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            DELETE FROM knowledge_articles WHERE id = $1 RETURNING id
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Article not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Article deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete article' 
        });
    }
});

module.exports = router;