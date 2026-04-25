const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const allow = require('../middleware/roles');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const safeParse = (val) => {
  try {
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const convertToCSV = (rows) => {
  if (!rows || !rows.length) return 'No data';

  const headers = [
    'Timestamp',
    'User',
    'Action',
    'Table',
    'Record ID',
    'IP Address'
  ];

  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = [
      row.created_at,
      row.user_name || 'System',
      row.action,
      row.table_name,
      row.record_id || '',
      row.ip_address || ''
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`);

    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

// ─────────────────────────────────────────────
// SECURITY: ALL ROUTES ADMIN ONLY
// (audit logs = medical/legal data)
// ─────────────────────────────────────────────

// GET /audit-logs
router.get('/', auth, allow('admin'), async (req, res) => {
  try {
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

    const MAX_LIMIT = 100;
    const safeLimit = Math.min(Number(limit), MAX_LIMIT);
    const offset = (Number(page) - 1) * safeLimit;

    const params = [req.user.clinicId];
    let where = 'al.clinic_id = $1';
    let i = 1;

    if (tableName) {
      params.push(tableName);
      where += ` AND al.table_name = $${++i}`;
    }

    if (action) {
      params.push(action);
      where += ` AND al.action = $${++i}`;
    }

    if (userId) {
      params.push(userId);
      where += ` AND al.user_id = $${++i}`;
    }

    if (from) {
      params.push(from);
      where += ` AND al.created_at >= $${++i}`;
    }

    if (to) {
      params.push(to + ' 23:59:59');
      where += ` AND al.created_at <= $${++i}`;
    }

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (
        al.table_name ILIKE $${++i} OR
        al.action ILIKE $${i}
      )`;
    }

    // Count
    const count = await pool.query(
      `SELECT COUNT(*) FROM audit_logs al WHERE ${where}`,
      params
    );

    const total = parseInt(count.rows[0].count);

    // Data
    params.push(safeLimit, offset);

    const result = await pool.query(
      `SELECT 
        al.*,
        u.full_name AS user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    );

    const data = result.rows.map((row) => ({
      ...row,
      old_values: safeParse(row.old_values),
      new_values: safeParse(row.new_values),
    }));

    res.json({
      data,
      total,
      page: Number(page),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    });
  } catch (err) {
    console.error('Audit logs error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
router.get('/stats', auth, allow('admin'), async (req, res) => {
  try {
    const { from, to } = req.query;

    const params = [req.user.clinicId];
    let where = 'clinic_id = $1';
    let i = 1;

    if (from) {
      params.push(from);
      where += ` AND created_at >= $${++i}`;
    }

    if (to) {
      params.push(to + ' 23:59:59');
      where += ` AND created_at <= $${++i}`;
    }

    const actions = await pool.query(
      `SELECT action, COUNT(*) 
       FROM audit_logs 
       WHERE ${where}
       GROUP BY action`,
      params
    );

    const tables = await pool.query(
      `SELECT table_name, COUNT(*) 
       FROM audit_logs 
       WHERE ${where}
       GROUP BY table_name`,
      params
    );

    const total = await pool.query(
      `SELECT COUNT(*) FROM audit_logs WHERE ${where}`,
      params
    );

    res.json({
      total: parseInt(total.rows[0].count),
      by_action: Object.fromEntries(
        actions.rows.map(r => [r.action, Number(r.count)])
      ),
      by_table: Object.fromEntries(
        tables.rows.map(r => [r.table_name, Number(r.count)])
      ),
    });
  } catch (err) {
    console.error('Audit stats error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// SINGLE ENTRY
// ─────────────────────────────────────────────
router.get('/:id', auth, allow('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.full_name AS user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.id = $1 AND al.clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    const row = result.rows[0];

    res.json({
      ...row,
      old_values: safeParse(row.old_values),
      new_values: safeParse(row.new_values),
    });
  } catch (err) {
    console.error('Audit single error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// EXPORT CSV
// ─────────────────────────────────────────────
router.post('/export', auth, allow('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        al.created_at,
        al.action,
        al.table_name,
        al.record_id,
        al.ip_address,
        u.full_name AS user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.clinic_id = $1
       ORDER BY al.created_at DESC
       LIMIT 5000`,
      [req.user.clinicId]
    );

    const csv = convertToCSV(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=audit-${Date.now()}.csv`
    );

    res.send(csv);
  } catch (err) {
    console.error('Audit export error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// DELETE SINGLE (ADMIN ONLY)
// ─────────────────────────────────────────────
router.delete('/:id', auth, allow('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM audit_logs
       WHERE id = $1 AND clinic_id = $2
       RETURNING id`,
      [req.params.id, req.user.clinicId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Audit delete error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});
// ─────────────────────────────────────────────
// RECENT ACTIVITY (for dashboard)
// ─────────────────────────────────────────────
router.get('/recent', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await getRecentActivity(req.user.clinicId, limit);
    res.json({ activities });
  } catch (err) {
    console.error('Recent activity error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// USER ACTIVITY SUMMARY
// ─────────────────────────────────────────────
router.get('/user/:userId/activity', auth, allow('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const summary = await getUserActivitySummary(userId, req.user.clinicId, days);
    res.json({ userId, days, summary });
  } catch (err) {
    console.error('User activity error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// SECURITY EVENTS (admin only)
// ─────────────────────────────────────────────
router.get('/security', auth, allow('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const { rows } = await pool.query(
      `SELECT 
         se.*,
         u.full_name as user_name
       FROM security_events se
       LEFT JOIN users u ON se.user_id = u.id
       WHERE se.clinic_id = $1 OR se.clinic_id IS NULL
       ORDER BY se.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.clinicId, limit, offset]
    );

    res.json({ events: rows });
  } catch (err) {
    // Table might not exist yet
    console.error('Security events error:', err.message);
    res.json({ events: [], message: 'Security events table not yet created' });
  }
});

module.exports = router;