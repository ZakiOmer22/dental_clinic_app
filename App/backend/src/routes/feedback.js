const express = require('express');
const router = express.Router();

// Import your database connection
const db = require('../db/pool'); // Adjust this path to your actual db connection

// GET all feedback
router.get('/', async (req, res) => {
    try {
        const { type, status, limit = 100, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                f.id,
                f.user_id,
                f.type,
                f.rating,
                f.comment,
                f.response,
                f.responded_by,
                f.responded_at,
                f.created_at,
                f.updated_at,
                COALESCE(u.full_name, 'Anonymous') as user_name,
                u.email as user_email,
                COALESCE(r.full_name, 'Admin') as responded_by_name
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
            LEFT JOIN users r ON f.responded_by = r.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (type && type !== 'all') {
            query += ` AND f.type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        
        if (status === 'responded') {
            query += ` AND f.response IS NOT NULL`;
        } else if (status === 'pending') {
            query += ` AND f.response IS NULL`;
        }
        
        query += ` ORDER BY f.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM feedback f WHERE 1=1`;
        if (type && type !== 'all') {
            countQuery += ` AND f.type = '${type}'`;
        }
        if (status === 'responded') {
            countQuery += ` AND f.response IS NOT NULL`;
        } else if (status === 'pending') {
            countQuery += ` AND f.response IS NULL`;
        }
        
        const countResult = await db.query(countQuery);
        
        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feedback',
            details: error.message
        });
    }
});

// GET feedback statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as responded,
                COUNT(CASE WHEN response IS NULL THEN 1 END) as pending,
                COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as total_ratings,
                COALESCE(SUM(rating), 0) as sum_ratings,
                COALESCE(AVG(rating), 0) as avg_rating,
                COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_ratings,
                COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_ratings
            FROM feedback
        `);
        
        const total = parseInt(stats.rows[0].total) || 0;
        const responded = parseInt(stats.rows[0].responded) || 0;
        const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
        
        // Calculate satisfaction score (based on ratings >= 4)
        const totalRatings = parseInt(stats.rows[0].total_ratings) || 0;
        const positiveRatings = parseInt(stats.rows[0].positive_ratings) || 0;
        const satisfactionScore = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 85;
        
        res.json({
            success: true,
            data: {
                total: total,
                responded: responded,
                pending: total - responded,
                responseRate: responseRate,
                totalRatings: totalRatings,
                sumRatings: parseFloat(stats.rows[0].sum_ratings) || 0,
                avgRating: parseFloat(stats.rows[0].avg_rating).toFixed(1),
                positiveRatings: positiveRatings,
                negativeRatings: parseInt(stats.rows[0].negative_ratings) || 0,
                satisfactionScore: satisfactionScore
            }
        });
    } catch (error) {
        console.error('Error fetching feedback stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            details: error.message
        });
    }
});

// GET single feedback item
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT 
                f.*,
                COALESCE(u.full_name, 'Anonymous') as user_name,
                u.email as user_email,
                COALESCE(r.full_name, 'Admin') as responded_by_name
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
            LEFT JOIN users r ON f.responded_by = r.id
            WHERE f.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Feedback not found'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch feedback',
            details: error.message
        });
    }
});

// POST submit new feedback
router.post('/', async (req, res) => {
    try {
        const { user_id, type, rating, comment } = req.body;
        
        if (!type || !comment) {
            return res.status(400).json({
                success: false,
                error: 'Type and comment are required'
            });
        }
        
        const result = await db.query(`
            INSERT INTO feedback (user_id, type, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [user_id || null, type, rating || null, comment]);
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Feedback submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback',
            details: error.message
        });
    }
});

// POST respond to feedback
router.post('/:id/respond', async (req, res) => {
    try {
        const { id } = req.params;
        const { response, respondedBy } = req.body;
        
        if (!response || !response.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Response cannot be empty'
            });
        }
        
        const result = await db.query(`
            UPDATE feedback
            SET 
                response = $1,
                responded_by = $2,
                responded_at = NOW(),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [response.trim(), respondedBy || null, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Feedback not found'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Response sent successfully'
        });
    } catch (error) {
        console.error('Error responding to feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send response',
            details: error.message
        });
    }
});

// DELETE feedback
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            DELETE FROM feedback WHERE id = $1 RETURNING id
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Feedback not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete feedback',
            details: error.message
        });
    }
});

module.exports = router;