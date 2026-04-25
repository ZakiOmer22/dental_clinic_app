const pool = require('../src/db/pool');

/**
 * Log an audit event - matches your existing schema
 */
const logAction = async ({
  user,
  action,
  entity,        // table_name
  entityId,      // record_id
  oldData = null,
  newData = null,
  metadata = {},
  req,
}) => {
  try {
    // Map action to allowed values
    const actionMap = {
      'LOGIN_SUCCESS': 'LOGIN',
      'LOGIN_FAILED': 'LOGIN',
      'CREATE': 'INSERT',
      'POST': 'INSERT'
    };

    const safeAction = actionMap[action] || action;

    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, clinic_id, action, table_name, record_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user?.id || null,
        user?.clinicId || null,
        safeAction,
        entity || 'system',
        entityId || null,
        req?.ip || req?.connection?.remoteAddress || null,
        req?.headers?.["user-agent"] || null,
      ]
    );
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

/**
 * Middleware to automatically log API requests
 */
const auditMiddleware = (action, entity) => {
  return (req, res, next) => {
    const user = req.user;
    const originalJson = res.json;

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || data?.id || data?.user?.id || null;

        logAction({
          user,
          action: action || `${req.method}_${req.path}`,
          entity: entity || req.baseUrl.split('/').pop(),
          entityId,
          oldData: ['PUT', 'PATCH'].includes(req.method) ? req.body : null,
          newData: ['POST', 'PUT', 'PATCH'].includes(req.method) ? data : null,
          metadata: {
            path: req.path,
            method: req.method,
            statusCode: res.statusCode
          },
          req
        }).catch(() => { });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Log security events (failed logins, token reuse, etc.)
 */
const logSecurityEvent = async ({
  user,
  eventType,
  severity = 'info',
  details = {},
  req
}) => {
  try {
    // Create security_events table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        clinic_id INTEGER,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'info',
        ip_address INET,
        user_agent TEXT,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await pool.query(
      `INSERT INTO security_events 
       (user_id, clinic_id, event_type, severity, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user?.id || null,
        user?.clinicId || null,
        eventType,
        severity,
        req?.ip || req?.connection?.remoteAddress || null,
        req?.headers?.["user-agent"] || null,
        JSON.stringify(details)
      ]
    );
  } catch (err) {
    console.error("Security event log failed:", err.message);
  }
};

/**
 * Get recent activity for a clinic
 */
const getRecentActivity = async (clinicId, limit = 20) => {
  const { rows } = await pool.query(
    `SELECT 
       al.id,
       al.action,
       al.table_name as entity,
       al.record_id as entity_id,
       al.created_at,
       al.ip_address,
       u.full_name as user_name
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.clinic_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2`,
    [clinicId, limit]
  );

  return rows.map(row => ({
    ...row,
    action: formatAction(row.action),
    description: `${row.user_name || 'System'} ${row.action} ${row.entity}${row.entity_id ? ' #' + row.entity_id.substring(0, 8) : ''}`
  }));
};

/**
 * Get user activity summary
 */
const getUserActivitySummary = async (userId, clinicId, days = 30) => {
  const { rows } = await pool.query(
    `SELECT 
       action,
       table_name as entity,
       COUNT(*) as count,
       MAX(created_at) as last_action
     FROM audit_logs
     WHERE user_id = $1 
       AND clinic_id = $2
       AND created_at > NOW() - INTERVAL '${days} days'
     GROUP BY action, table_name
     ORDER BY count DESC`,
    [userId, clinicId]
  );
  return rows;
};

/**
 * Format action names for display
 */
const formatAction = (action) => {
  const formats = {
    'CREATE': 'created',
    'UPDATE': 'updated',
    'DELETE': 'deleted',
    'VIEW': 'viewed',
    'LOGIN': 'logged in',
    'LOGIN_SUCCESS': 'logged in successfully',
    'LOGIN_FAILED': 'failed to log in',
    'LOGOUT': 'logged out',
    'EXPORT': 'exported',
    'DOWNLOAD': 'downloaded',
    'POST': 'created',
    'PUT': 'updated',
    'PATCH': 'updated',
    'GET': 'viewed'
  };
  return formats[action] || action.toLowerCase();
};

module.exports = {
  logAction,
  auditMiddleware,
  logSecurityEvent,
  getRecentActivity,
  getUserActivitySummary
};