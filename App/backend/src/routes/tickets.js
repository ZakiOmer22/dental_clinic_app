const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

// =====================
// STATS (MUST BE FIRST)
// =====================
router.get('/stats', async (req, res) => {
    try {
        const clinicId = req.user.clinicId;

        const statusStats = await pool.query(
            `SELECT status, COUNT(*) FROM tickets WHERE clinic_id=$1 GROUP BY status`,
            [clinicId]
        );

        const priorityStats = await pool.query(
            `SELECT priority, COUNT(*) FROM tickets WHERE clinic_id=$1 GROUP BY priority`,
            [clinicId]
        );

        res.json({
            byStatus: Object.fromEntries(statusStats.rows.map(r => [r.status, +r.count])),
            byPriority: Object.fromEntries(priorityStats.rows.map(r => [r.priority, +r.count]))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// =====================
// GET ALL TICKETS
// =====================
router.get('/', async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const params = [req.user.clinicId];
        let where = `t.clinic_id = $1`;

        if (status) {
            params.push(status);
            where += ` AND t.status = $${params.length}`;
        }

        if (priority) {
            params.push(priority);
            where += ` AND t.priority = $${params.length}`;
        }

        const result = await pool.query(
            `SELECT t.*,
                    c.full_name as created_by_name,
                    a.full_name as assigned_to_name
             FROM tickets t
             LEFT JOIN users c ON t.created_by = c.id
             LEFT JOIN users a ON t.assigned_to = a.id
             WHERE ${where}
             ORDER BY t.created_at DESC
             LIMIT $${params.length + 1}
             OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        const count = await pool.query(
            `SELECT COUNT(*) FROM tickets t WHERE ${where}`,
            params
        );

        res.json({
            data: result.rows,
            total: +count.rows[0].count
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;