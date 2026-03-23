// ─────────────────────────────────────────────────────────────────────────────
// src/routes/audit.js
// ─────────────────────────────────────────────────────────────────────────────

const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// Helper function to convert to CSV
const convertToCSV = (rows) => {
  if (!rows || !rows.length) return 'No data';

  const headers = ['Timestamp', 'User', 'Action', 'Table', 'Record ID', 'Description', 'IP Address', 'User Agent'];
  const csvRows = [];

  csvRows.push(headers.join(','));

  for (const row of rows) {
    const description = `${row.action} on ${row.table_name}` + (row.record_id ? ` (ID: ${row.record_id})` : '');
    const values = [
      row.created_at,
      row.user_name || 'System',
      row.action,
      row.table_name,
      row.record_id || '',
      description,
      row.ip_address || '',
      (row.user_agent || '').replace(/,/g, ';')
    ].map(value => `"${String(value).replace(/"/g, '""')}"`);

    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

/**
 * GET /audit-logs
 * Get audit logs with filtering
 */
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /audit-logs called with query:', req.query);

    const {
      tableName,
      action,
      userId,
      from,
      to,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [req.user.clinicId];
    let whereClause = 'al.clinic_id = $1';
    let paramIndex = 1;

    // Apply filters
    if (tableName) {
      paramIndex++;
      params.push(tableName);
      whereClause += ` AND al.table_name = $${paramIndex}`;
    }

    if (action) {
      paramIndex++;
      params.push(action);
      whereClause += ` AND al.action = $${paramIndex}`;
    }

    if (userId) {
      paramIndex++;
      params.push(userId);
      whereClause += ` AND al.user_id = $${paramIndex}`;
    }

    if (from) {
      paramIndex++;
      params.push(from);
      whereClause += ` AND al.created_at >= $${paramIndex}`;
    }

    if (to) {
      paramIndex++;
      params.push(to + ' 23:59:59');
      whereClause += ` AND al.created_at <= $${paramIndex}`;
    }

    if (search) {
      paramIndex++;
      params.push(`%${search}%`);
      whereClause += ` AND (
                al.table_name ILIKE $${paramIndex} OR 
                al.action ILIKE $${paramIndex} OR 
                u.full_name ILIKE $${paramIndex}
            )`;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    paramIndex += 2;
    const result = await pool.query(
      `SELECT 
                al.*, 
                u.full_name AS user_name,
                u.email AS user_email
             FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE ${whereClause} 
             ORDER BY al.created_at DESC 
             LIMIT $${paramIndex - 1} OFFSET $${paramIndex}`,
      [...params, parseInt(limit), offset]
    );

    // Transform data for frontend
    const data = result.rows.map(row => ({
      ...row,
      old_values: row.old_values ? JSON.parse(row.old_values) : null,
      new_values: row.new_values ? JSON.parse(row.new_values) : null,
      changes: {
        old: row.old_values ? JSON.parse(row.old_values) : {},
        new: row.new_values ? JSON.parse(row.new_values) : {}
      },
      description: `${row.action} on ${row.table_name}` + (row.record_id ? ` (ID: ${row.record_id})` : '')
    }));

    res.json({
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('Error in GET /audit-logs:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/**
 * GET /audit-logs/stats
 * Get audit statistics
 */
router.get('/stats', auth, async (req, res) => {
  try {
    console.log('GET /audit-logs/stats called');

    const { from, to } = req.query;
    const params = [req.user.clinicId];
    let whereClause = 'clinic_id = $1';

    if (from) {
      params.push(from);
      whereClause += ` AND created_at >= $${params.length}`;
    }
    if (to) {
      params.push(to + ' 23:59:59');
      whereClause += ` AND created_at <= $${params.length}`;
    }

    // Get counts by action
    const actionStats = await pool.query(
      `SELECT action, COUNT(*) as count 
             FROM audit_logs 
             WHERE ${whereClause} 
             GROUP BY action`,
      params
    );

    // Get counts by table
    const tableStats = await pool.query(
      `SELECT table_name, COUNT(*) as count 
             FROM audit_logs 
             WHERE ${whereClause} 
             GROUP BY table_name`,
      params
    );

    // Get counts by user
    const userStats = await pool.query(
      `SELECT al.user_id, u.full_name as user_name, COUNT(*) as count 
             FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE ${whereClause} 
             GROUP BY al.user_id, u.full_name`,
      params
    );

    // Get total count
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}`,
      params
    );

    // Get recent activity
    const recentResult = await pool.query(
      `SELECT al.*, u.full_name as user_name 
             FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE al.clinic_id = $1 
             ORDER BY al.created_at DESC 
             LIMIT 10`,
      [req.user.clinicId]
    );

    const byAction = {};
    actionStats.rows.forEach(row => {
      byAction[row.action] = parseInt(row.count);
    });

    const byTable = {};
    tableStats.rows.forEach(row => {
      byTable[row.table_name] = parseInt(row.count);
    });

    const byUser = {};
    userStats.rows.forEach(row => {
      byUser[row.user_name || `User ${row.user_id}`] = parseInt(row.count);
    });

    // Transform recent activity
    const recentActivity = recentResult.rows.map(row => ({
      ...row,
      old_values: row.old_values ? JSON.parse(row.old_values) : null,
      new_values: row.new_values ? JSON.parse(row.new_values) : null
    }));

    res.json({
      total: parseInt(totalResult.rows[0].total),
      by_action: byAction,
      by_table: byTable,
      by_user: byUser,
      recent_activity: recentActivity
    });
  } catch (err) {
    console.error('Error in GET /audit-logs/stats:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/**
 * GET /audit-logs/record/:tableName/:recordId
 * Get audit trail for a specific record
 */
router.get('/record/:tableName/:recordId', auth, async (req, res) => {
  try {
    console.log('GET /audit-logs/record called', req.params);

    const { tableName, recordId } = req.params;

    const result = await pool.query(
      `SELECT 
                al.*, 
                u.full_name AS user_name
             FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE al.clinic_id = $1 
               AND al.table_name = $2 
               AND al.record_id = $3 
             ORDER BY al.created_at DESC`,
      [req.user.clinicId, tableName, recordId]
    );

    // Transform data
    const data = result.rows.map(row => ({
      ...row,
      old_values: row.old_values ? JSON.parse(row.old_values) : null,
      new_values: row.new_values ? JSON.parse(row.new_values) : null
    }));

    res.json(data);
  } catch (err) {
    console.error('Error in GET /audit-logs/record:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/**
 * GET /audit-logs/tables
 * Get unique tables that have audit logs
 */
router.get('/tables', auth, async (req, res) => {
  try {
    console.log('GET /audit-logs/tables called');

    const result = await pool.query(
      `SELECT DISTINCT table_name 
             FROM audit_logs 
             WHERE clinic_id = $1 
             ORDER BY table_name`,
      [req.user.clinicId]
    );

    res.json(result.rows.map(row => row.table_name));
  } catch (err) {
    console.error('Error in GET /audit-logs/tables:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/**
 * GET /audit-logs/actions
 * Get unique actions that appear in audit logs
 */
router.get('/actions', auth, async (req, res) => {
  try {
    console.log('GET /audit-logs/actions called');

    const result = await pool.query(
      `SELECT DISTINCT action 
             FROM audit_logs 
             WHERE clinic_id = $1 
             ORDER BY action`,
      [req.user.clinicId]
    );

    res.json(result.rows.map(row => row.action));
  } catch (err) {
    console.error('Error in GET /audit-logs/actions:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/**
 * POST /audit-logs/export
 * Export audit logs as CSV
 */
router.post('/export', auth, async (req, res) => {
  try {
    console.log('POST /audit-logs/export called with body:', req.body);

    const {
      tableName,
      action,
      userId,
      from,
      to,
      search
    } = req.body;

    const params = [req.user.clinicId];
    let whereClause = 'al.clinic_id = $1';
    let paramIndex = 1;

    // Apply filters
    if (tableName) {
      paramIndex++;
      params.push(tableName);
      whereClause += ` AND al.table_name = $${paramIndex}`;
    }

    if (action) {
      paramIndex++;
      params.push(action);
      whereClause += ` AND al.action = $${paramIndex}`;
    }

    if (userId) {
      paramIndex++;
      params.push(userId);
      whereClause += ` AND al.user_id = $${paramIndex}`;
    }

    if (from) {
      paramIndex++;
      params.push(from);
      whereClause += ` AND al.created_at >= $${paramIndex}`;
    }

    if (to) {
      paramIndex++;
      params.push(to + ' 23:59:59');
      whereClause += ` AND al.created_at <= $${paramIndex}`;
    }

    if (search) {
      paramIndex++;
      params.push(`%${search}%`);
      whereClause += ` AND (
                al.table_name ILIKE $${paramIndex} OR 
                al.action ILIKE $${paramIndex} OR 
                u.full_name ILIKE $${paramIndex}
            )`;
    }

    // Get data for export
    const result = await pool.query(
      `SELECT 
                al.created_at,
                al.action,
                al.table_name,
                al.record_id,
                al.ip_address,
                al.user_agent,
                u.full_name AS user_name
             FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE ${whereClause} 
             ORDER BY al.created_at DESC`,
      params
    );

    // Convert to CSV
    const csv = convertToCSV(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Error in POST /audit-logs/export:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/**
 * GET /audit-logs/:id
 * Get a single audit entry by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('GET /audit-logs/:id called', req.params.id);

    const result = await pool.query(
      `SELECT 
                al.*, 
                u.full_name AS user_name
             FROM audit_logs al 
             LEFT JOIN users u ON al.user_id = u.id 
             WHERE al.id = $1 AND al.clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit entry not found' });
    }

    const row = result.rows[0];
    const data = {
      ...row,
      old_values: row.old_values ? JSON.parse(row.old_values) : null,
      new_values: row.new_values ? JSON.parse(row.new_values) : null
    };

    res.json(data);
  } catch (err) {
    console.error('Error in GET /audit-logs/:id:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/**
 * DELETE /audit-logs/:id
 * Delete a single audit entry (admin only)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('DELETE /audit-logs/:id called', req.params.id);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      'DELETE FROM audit_logs WHERE id = $1 AND clinic_id = $2 RETURNING id',
      [req.params.id, req.user.clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit entry not found' });
    }

    res.json({ success: true, message: 'Audit entry deleted' });
  } catch (err) {
    console.error('Error in DELETE /audit-logs/:id:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/**
 * DELETE /audit-logs
 * Clear all audit logs (admin only)
 */
router.delete('/', auth, async (req, res) => {
  try {
    console.log('DELETE /audit-logs called');

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      'DELETE FROM audit_logs WHERE clinic_id = $1 RETURNING id',
      [req.user.clinicId]
    );

    res.json({
      success: true,
      message: `Cleared ${result.rowCount} audit entries`,
      count: result.rowCount
    });
  } catch (err) {
    console.error('Error in DELETE /audit-logs:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;