// ─────────────────────────────────────────────────────────────
// src/routes/tickets.js
// ─────────────────────────────────────────────────────────────

const router = require('express').Router();
const pool = require('../db/pool');

// Auth middleware
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token (implement your own verification logic)
        // For now, we'll decode the user from the token
        // This is a placeholder - replace with your actual auth logic
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        req.user = {
            id: decoded.userId || 1,
            clinicId: decoded.clinicId || 1,
            role: decoded.role || 'admin'
        };
        
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Apply auth to all routes
router.use(authenticate);

/**
 * GET /tickets - Get all tickets
 */
router.get('/', async (req, res) => {
    try {
        const { 
            status, 
            priority, 
            category, 
            assigned_to, 
            created_by,
            page = 1, 
            limit = 50,
            search 
        } = req.query;

        let query = `
            SELECT 
                t.*,
                creator.full_name as created_by_name,
                assignee.full_name as assigned_to_name
            FROM tickets t
            LEFT JOIN users creator ON t.created_by = creator.id
            LEFT JOIN users assignee ON t.assigned_to = assignee.id
            WHERE t.clinic_id = $1
        `;
        
        const params = [req.user.clinicId];
        let paramCount = 1;

        if (status && status !== 'all') {
            paramCount++;
            query += ` AND t.status = $${paramCount}`;
            params.push(status);
        }

        if (priority && priority !== 'all') {
            paramCount++;
            query += ` AND t.priority = $${paramCount}`;
            params.push(priority);
        }

        if (category && category !== 'all') {
            paramCount++;
            query += ` AND t.category = $${paramCount}`;
            params.push(category);
        }

        if (assigned_to) {
            paramCount++;
            query += ` AND t.assigned_to = $${paramCount}`;
            params.push(parseInt(assigned_to));
        }

        if (created_by) {
            paramCount++;
            query += ` AND t.created_by = $${paramCount}`;
            params.push(parseInt(created_by));
        }

        if (search) {
            paramCount++;
            query += ` AND (t.subject ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${query}) as count`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Add pagination
        query += ` ORDER BY t.created_at DESC 
                   LIMIT $${paramCount + 1} 
                   OFFSET $${paramCount + 2}`;
        
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const { rows } = await pool.query(query, params);

        // Get comments for each ticket
        for (const ticket of rows) {
            const comments = await pool.query(
                `SELECT 
                    c.*,
                    u.full_name as user_name
                 FROM ticket_comments c
                 LEFT JOIN users u ON c.user_id = u.id
                 WHERE c.ticket_id = $1
                 ORDER BY c.created_at ASC`,
                [ticket.id]
            );
            ticket.comments = comments.rows;
        }

        res.json({
            data: rows,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error('Error in GET /tickets:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /tickets/:id - Get single ticket
 */
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT 
                t.*,
                creator.full_name as created_by_name,
                assignee.full_name as assigned_to_name
             FROM tickets t
             LEFT JOIN users creator ON t.created_by = creator.id
             LEFT JOIN users assignee ON t.assigned_to = assignee.id
             WHERE t.id = $1 AND t.clinic_id = $2`,
            [req.params.id, req.user.clinicId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = rows[0];

        const comments = await pool.query(
            `SELECT 
                c.*,
                u.full_name as user_name
             FROM ticket_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.ticket_id = $1
             ORDER BY c.created_at ASC`,
            [ticket.id]
        );
        ticket.comments = comments.rows;

        res.json(ticket);
    } catch (err) {
        console.error('Error in GET /tickets/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /tickets - Create new ticket
 */
router.post('/', async (req, res) => {
    try {
        const { subject, description, category, priority } = req.body;

        if (!subject || !description || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { rows } = await pool.query(
            `INSERT INTO tickets 
             (clinic_id, subject, description, category, priority, created_by, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'open')
             RETURNING *`,
            [req.user.clinicId, subject, description, category, priority || 'medium', req.user.id]
        );

        const userResult = await pool.query(
            'SELECT full_name FROM users WHERE id = $1',
            [req.user.id]
        );

        const ticket = rows[0];
        ticket.created_by_name = userResult.rows[0]?.full_name || 'Unknown';
        ticket.comments = [];

        res.status(201).json(ticket);
    } catch (err) {
        console.error('Error in POST /tickets:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /tickets/:id - Update ticket
 */
router.put('/:id', async (req, res) => {
    try {
        const { subject, description, category, priority, status, assigned_to } = req.body;

        const check = await pool.query(
            'SELECT * FROM tickets WHERE id = $1 AND clinic_id = $2',
            [req.params.id, req.user.clinicId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const updates = [];
        const values = [];
        let valueCount = 1;

        if (subject) {
            updates.push(`subject = $${valueCount++}`);
            values.push(subject);
        }
        if (description) {
            updates.push(`description = $${valueCount++}`);
            values.push(description);
        }
        if (category) {
            updates.push(`category = $${valueCount++}`);
            values.push(category);
        }
        if (priority) {
            updates.push(`priority = $${valueCount++}`);
            values.push(priority);
        }
        if (status) {
            updates.push(`status = $${valueCount++}`);
            values.push(status);
            
            if (status === 'resolved' && check.rows[0].status !== 'resolved') {
                updates.push(`resolved_at = NOW()`);
            }
        }
        if (assigned_to !== undefined) {
            updates.push(`assigned_to = $${valueCount++}`);
            values.push(assigned_to);
        }

        updates.push(`updated_at = NOW()`);

        values.push(req.params.id, req.user.clinicId);

        const { rows } = await pool.query(
            `UPDATE tickets 
             SET ${updates.join(', ')}
             WHERE id = $${valueCount++} AND clinic_id = $${valueCount}
             RETURNING *`,
            [...values, req.params.id, req.user.clinicId]
        );

        const userResult = await pool.query(
            'SELECT full_name FROM users WHERE id = $1',
            [rows[0].created_by]
        );
        rows[0].created_by_name = userResult.rows[0]?.full_name || 'Unknown';

        if (rows[0].assigned_to) {
            const assigneeResult = await pool.query(
                'SELECT full_name FROM users WHERE id = $1',
                [rows[0].assigned_to]
            );
            rows[0].assigned_to_name = assigneeResult.rows[0]?.full_name || null;
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error in PUT /tickets/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /tickets/:id - Delete ticket
 */
router.delete('/:id', async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM ticket_comments WHERE ticket_id = $1',
            [req.params.id]
        );

        const { rowCount } = await pool.query(
            'DELETE FROM tickets WHERE id = $1 AND clinic_id = $2',
            [req.params.id, req.user.clinicId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.json({ 
            success: true, 
            message: 'Ticket deleted successfully' 
        });
    } catch (err) {
        console.error('Error in DELETE /tickets/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /tickets/:id/comments - Add comment
 */
router.post('/:id/comments', async (req, res) => {
    try {
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ error: 'Comment is required' });
        }

        const ticketCheck = await pool.query(
            'SELECT id FROM tickets WHERE id = $1 AND clinic_id = $2',
            [req.params.id, req.user.clinicId]
        );

        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const { rows } = await pool.query(
            `INSERT INTO ticket_comments (ticket_id, user_id, comment)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [req.params.id, req.user.id, comment]
        );

        const userResult = await pool.query(
            'SELECT full_name FROM users WHERE id = $1',
            [req.user.id]
        );
        rows[0].user_name = userResult.rows[0]?.full_name || 'Unknown';

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error in POST /tickets/:id/comments:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /tickets/:id/comments - Get comments
 */
router.get('/:id/comments', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT 
                c.*,
                u.full_name as user_name
             FROM ticket_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.ticket_id = $1
             ORDER BY c.created_at ASC`,
            [req.params.id]
        );

        res.json(rows);
    } catch (err) {
        console.error('Error in GET /tickets/:id/comments:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /tickets/stats - Get ticket statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const statusStats = await pool.query(
            `SELECT status, COUNT(*) as count
             FROM tickets
             WHERE clinic_id = $1
             GROUP BY status`,
            [req.user.clinicId]
        );

        const priorityStats = await pool.query(
            `SELECT priority, COUNT(*) as count
             FROM tickets
             WHERE clinic_id = $1
             GROUP BY priority`,
            [req.user.clinicId]
        );

        const categoryStats = await pool.query(
            `SELECT category, COUNT(*) as count
             FROM tickets
             WHERE clinic_id = $1
             GROUP BY category`,
            [req.user.clinicId]
        );

        const openTickets = await pool.query(
            `SELECT COUNT(*) as count
             FROM tickets
             WHERE clinic_id = $1 AND status = 'open'`,
            [req.user.clinicId]
        );

        const resolvedToday = await pool.query(
            `SELECT COUNT(*) as count
             FROM tickets
             WHERE clinic_id = $1 
               AND status = 'resolved'
               AND resolved_at::date = CURRENT_DATE`,
            [req.user.clinicId]
        );

        const byStatus = {};
        statusStats.rows.forEach(row => byStatus[row.status] = parseInt(row.count));

        const byPriority = {};
        priorityStats.rows.forEach(row => byPriority[row.priority] = parseInt(row.count));

        const byCategory = {};
        categoryStats.rows.forEach(row => byCategory[row.category] = parseInt(row.count));

        res.json({
            total: parseInt(statusStats.rows.reduce((acc, row) => acc + parseInt(row.count), 0)),
            byStatus,
            byPriority,
            byCategory,
            avgResponseTime: 'N/A',
            openTickets: parseInt(openTickets.rows[0].count),
            resolvedToday: parseInt(resolvedToday.rows[0].count)
        });
    } catch (err) {
        console.error('Error in GET /tickets/stats:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;