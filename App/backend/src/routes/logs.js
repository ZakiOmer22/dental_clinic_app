const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

/* ============================================================
   GET LOGS (FILTERED + PAGINATED)
============================================================ */

router.get('/', auth, async (req, res) => {
  try {
    const {
      severity,
      module,
      page = 1,
      limit = 50,
      start_date,
      end_date
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let where = `WHERE clinic_id = $1`;
    const params = [req.user.clinicId];

    if (severity && severity !== 'all') {
      params.push(severity);
      where += ` AND severity = $${params.length}`;
    }

    if (module && module !== 'all') {
      params.push(module);
      where += ` AND module = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      where += ` AND timestamp >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      where += ` AND timestamp <= $${params.length}`;
    }

    // count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM system_logs ${where}`,
      params
    );

    // data
    const dataParams = [...params, limit, offset];

    const { rows } = await pool.query(
      `SELECT id, timestamp, severity, module, message, user_name, stack_trace, metadata
       FROM system_logs
       ${where}
       ORDER BY timestamp DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    // severity counts
    const stats = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE severity='error') AS error,
        COUNT(*) FILTER (WHERE severity='warning') AS warning,
        COUNT(*) FILTER (WHERE severity='info') AS info,
        COUNT(*) FILTER (WHERE severity='debug') AS debug,
        COUNT(*) FILTER (WHERE severity='success') AS success
       FROM system_logs
       ${where}`,
      params
    );

    res.json({
      data: rows,
      total: Number(countRes.rows[0].count),
      page: Number(page),
      limit: Number(limit),
      counts: stats.rows[0]
    });

  } catch (err) {
    console.error('GET /logs error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   GET SINGLE LOG
============================================================ */

router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM system_logs
       WHERE id=$1 AND clinic_id=$2`,
      [req.params.id, req.user.clinicId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   DELETE ALL LOGS (ADMIN ONLY)
============================================================ */

router.delete('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin required' });
    }

    const result = await pool.query(
      `DELETE FROM system_logs WHERE clinic_id=$1`,
      [req.user.clinicId]
    );

    res.json({
      success: true,
      deleted: result.rowCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   EXPORT CSV
============================================================ */

router.post('/export', auth, async (req, res) => {
  try {
    const { severity, module, start_date, end_date } = req.body;

    let where = `WHERE clinic_id=$1`;
    const params = [req.user.clinicId];

    if (severity) {
      params.push(severity);
      where += ` AND severity=$${params.length}`;
    }

    if (module) {
      params.push(module);
      where += ` AND module=$${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      where += ` AND timestamp >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      where += ` AND timestamp <= $${params.length}`;
    }

    const { rows } = await pool.query(
      `SELECT timestamp, severity, module, message, user_name
       FROM system_logs
       ${where}
       ORDER BY timestamp DESC`,
      params
    );

    const csv = convertToCSV(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   STATS (FIXED)
============================================================ */

router.get('/stats', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') AS last_24h,
        COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') AS last_7d
       FROM system_logs
       WHERE clinic_id=$1`,
      [req.user.clinicId]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   DELETE SINGLE LOG
============================================================ */

router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin required' });
    }

    const result = await pool.query(
      `DELETE FROM system_logs
       WHERE id=$1 AND clinic_id=$2
       RETURNING id`,
      [req.params.id, req.user.clinicId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   CSV HELPER
============================================================ */

function convertToCSV(rows) {
  if (!rows.length) return 'empty';

  const header = 'timestamp,severity,module,message,user_name';
  const data = rows.map(r =>
    `${r.timestamp},${r.severity},${r.module},${r.message},${r.user_name || ''}`
  );

  return [header, ...data].join('\n');
}

module.exports = router;