// ─────────────────────────────────────────────────────────────
// src/routes/logs.js
// ─────────────────────────────────────────────────────────────

const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

/**
 * GET /logs
 * Get system logs with filtering from database
 */
router.get('/', auth, async (req, res) => {
    try {
        console.log('GET /logs called with query:', req.query);
        
        const { 
            severity, 
            module: moduleFilter, 
            page = 1, 
            limit = 50,
            start_date,
            end_date 
        } = req.query;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [req.user.clinicId];
        let whereClause = 'WHERE clinic_id = $1';
        let paramIndex = 1;

        // Apply filters
        if (severity && severity !== 'all') {
            paramIndex++;
            whereClause += ` AND severity = $${paramIndex}`;
            params.push(severity);
        }

        if (moduleFilter && moduleFilter !== 'all') {
            paramIndex++;
            whereClause += ` AND module = $${paramIndex}`;
            params.push(moduleFilter);
        }

        if (start_date) {
            paramIndex++;
            whereClause += ` AND timestamp >= $${paramIndex}`;
            params.push(start_date);
        }

        if (end_date) {
            paramIndex++;
            whereClause += ` AND timestamp <= $${paramIndex}`;
            params.push(end_date);
        }

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM system_logs ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get paginated logs
        paramIndex++;
        const logsResult = await pool.query(
            `SELECT 
                id, 
                timestamp, 
                severity, 
                module, 
                message, 
                user_name,
                stack_trace,
                metadata
            FROM system_logs 
            ${whereClause}
            ORDER BY timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, parseInt(limit), offset]
        );

        // Get counts by severity for KPIs
        const countsResult = await pool.query(
            `SELECT 
                COUNT(CASE WHEN severity = 'error' THEN 1 END) as error_count,
                COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning_count,
                COUNT(CASE WHEN severity = 'info' THEN 1 END) as info_count,
                COUNT(CASE WHEN severity = 'debug' THEN 1 END) as debug_count,
                COUNT(CASE WHEN severity = 'success' THEN 1 END) as success_count
            FROM system_logs 
            ${whereClause.replace('system_logs', 'system_logs')}`,
            params
        );

        const counts = countsResult.rows[0];

        res.json({
            data: logsResult.rows,
            counts: {
                error: parseInt(counts.error_count || 0),
                warning: parseInt(counts.warning_count || 0),
                info: parseInt(counts.info_count || 0),
                debug: parseInt(counts.debug_count || 0),
                success: parseInt(counts.success_count || 0)
            },
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error('Error in GET /logs:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /logs
 * Clear all logs (admin only)
 */
router.delete('/', auth, async (req, res) => {
    try {
        console.log('DELETE /logs called');
        
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const result = await pool.query(
            'DELETE FROM system_logs WHERE clinic_id = $1 RETURNING id',
            [req.user.clinicId]
        );

        // Log the action
        await pool.query(
            `INSERT INTO audit_logs (user_id, clinic_id, table_name, action, record_id, new_values)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.user.id, req.user.clinicId, 'system_logs', 'CLEAR', null, JSON.stringify({ count: result.rowCount })]
        );

        res.json({ 
            success: true, 
            message: `Cleared ${result.rowCount} logs`,
            count: result.rowCount
        });
    } catch (err) {
        console.error('Error in DELETE /logs:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /logs/export
 * Export logs as CSV
 */
router.post('/export', auth, async (req, res) => {
    try {
        console.log('POST /logs/export called with body:', req.body);
        
        const { severity, module: moduleFilter, start_date, end_date } = req.body;
        
        let query = `
            SELECT 
                timestamp, 
                severity, 
                module, 
                message, 
                user_name,
                stack_trace
            FROM system_logs 
            WHERE clinic_id = $1
        `;
        const params = [req.user.clinicId];
        let paramIndex = 1;

        if (severity && severity !== 'all') {
            paramIndex++;
            query += ` AND severity = $${paramIndex}`;
            params.push(severity);
        }

        if (moduleFilter && moduleFilter !== 'all') {
            paramIndex++;
            query += ` AND module = $${paramIndex}`;
            params.push(moduleFilter);
        }

        if (start_date) {
            paramIndex++;
            query += ` AND timestamp >= $${paramIndex}`;
            params.push(start_date);
        }

        if (end_date) {
            paramIndex++;
            query += ` AND timestamp <= $${paramIndex}`;
            params.push(end_date);
        }

        query += ' ORDER BY timestamp DESC';

        const result = await pool.query(query, params);

        // Convert to CSV
        const csv = convertToCSV(result.rows);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=system-logs-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (err) {
        console.error('Error in POST /logs/export:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /logs/stats
 * Get log statistics
 */
router.get('/stats', auth, async (req, res) => {
    try {
        console.log('GET /logs/stats called');

        const result = await pool.query(`
            WITH time_ranges AS (
                SELECT 
                    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as last_24h,
                    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') as last_7d,
                    COUNT(*) as total
                FROM system_logs 
                WHERE clinic_id = $1
            ),
            severity_counts AS (
                SELECT 
                    severity,
                    COUNT(*) as count
                FROM system_logs 
                WHERE clinic_id = $1
                GROUP BY severity
            ),
            module_counts AS (
                SELECT 
                    module,
                    COUNT(*) as count
                FROM system_logs 
                WHERE clinic_id = $1
                GROUP BY module
            ),
            top_errors AS (
                SELECT 
                    message,
                    module,
                    COUNT(*) as count
                FROM system_logs 
                WHERE clinic_id = $1 AND severity = 'error'
                GROUP BY message, module
                ORDER BY count DESC
                LIMIT 5
            )
            SELECT 
                json_build_object(
                    'total', (SELECT total FROM time_ranges),
                    'last_24h', (SELECT last_24h FROM time_ranges),
                    'last_7d', (SELECT last_7d FROM time_ranges),
                    'by_severity', json_object_agg(severity, count),
                    'by_module', json_object_agg(module, count),
                    'top_errors', json_agg(json_build_object('message', message, 'count', count, 'module', module))
                ) as stats
            FROM severity_counts, module_counts, top_errors
            GROUP BY severity_counts.severity, module_counts.module, top_errors.message
        `, [req.user.clinicId]);

        res.json(result.rows[0]?.stats || {
            total: 0,
            last_24h: 0,
            last_7d: 0,
            by_severity: {},
            by_module: {},
            top_errors: []
        });
    } catch (err) {
        console.error('Error in GET /logs/stats:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /logs/:id
 * Get a single log entry
 */
router.get('/:id', auth, async (req, res) => {
    try {
        console.log('GET /logs/:id called', req.params.id);

        const result = await pool.query(
            `SELECT 
                id, 
                timestamp, 
                severity, 
                module, 
                message, 
                user_name,
                stack_trace,
                metadata
            FROM system_logs 
            WHERE id = $1 AND clinic_id = $2`,
            [req.params.id, req.user.clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Log not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in GET /logs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /logs/:id
 * Delete a single log entry
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log('DELETE /logs/:id called', req.params.id);

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const result = await pool.query(
            'DELETE FROM system_logs WHERE id = $1 AND clinic_id = $2 RETURNING id',
            [req.params.id, req.user.clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Log not found' });
        }

        // Log the action
        await pool.query(
            `INSERT INTO audit_logs (user_id, clinic_id, table_name, action, record_id, old_values)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.user.id, req.user.clinicId, 'system_logs', 'DELETE', req.params.id, JSON.stringify(result.rows[0])]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /logs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// Helper function to convert to CSV
function convertToCSV(rows) {
    if (!rows.length) return 'No data';
    
    const headers = ['Timestamp', 'Severity', 'Module', 'Message', 'User', 'Stack Trace'];
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const row of rows) {
        const values = [
            row.timestamp,
            row.severity,
            row.module || 'System',
            row.message,
            row.user_name || 'System',
            (row.stack_trace || '').replace(/\n/g, '\\n').replace(/,/g, ';')
        ].map(value => `"${String(value).replace(/"/g, '""')}"`);
        
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

module.exports = router;