// src/api/v1/routes/adminRoutes.js
const router = require('express').Router();
const auth = require('../../../middleware/auth');
const pool = require('../../../db/pool');

// Middleware: Admin or Super Admin only
const adminOnly = (req, res, next) => {
  const allowedRoles = ['admin', 'super_admin'];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Access denied. Admin privileges required.',
      currentRole: req.user.role
    });
  }
  next();
};

const isSuperAdmin = (user) => user.role === 'super_admin';

// ============================================================
// DASHBOARD OVERVIEW
// ============================================================
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const clinicsResult = await pool.query(`SELECT COUNT(*) as total FROM clinics`);
    const activeClinicsResult = await pool.query(`
      SELECT COUNT(*) as total FROM clinic_subscriptions WHERE status = 'active'
    `);
    const pendingResult = await pool.query(`
      SELECT COUNT(*) as total FROM clinics WHERE status = 'pending'
    `);
    const patientsResult = await pool.query(`SELECT COUNT(*) as total FROM patients`);
    const revenueResult = await pool.query(`
      SELECT COALESCE(SUM(amount_paid), 0) as total 
      FROM subscription_invoices 
      WHERE status = 'paid' 
        AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    const subscriptionsResult = await pool.query(`
      SELECT COUNT(*) as total FROM clinic_subscriptions WHERE status = 'active'
    `);
    const trialResult = await pool.query(`
      SELECT COUNT(*) as total FROM clinic_subscriptions WHERE status = 'trialing'
    `);

    res.json({
      totalClinics: parseInt(clinicsResult.rows[0]?.total || 0),
      activeClinics: parseInt(activeClinicsResult.rows[0]?.total || 0),
      pendingApprovals: parseInt(pendingResult.rows[0]?.total || 0),
      totalPatients: parseInt(patientsResult.rows[0]?.total || 0),
      monthlyRevenue: parseFloat(revenueResult.rows[0]?.total || 0),
      activeSubscriptions: parseInt(subscriptionsResult.rows[0]?.total || 0),
      trialClinics: parseInt(trialResult.rows[0]?.total || 0),
      growth: 15.8
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// CLINICS
// ============================================================
router.get('/clinics', auth, adminOnly, async (req, res) => {
  try {
    let query;
    let params = [];

    if (isSuperAdmin(req.user)) {
      query = `
        SELECT c.*, 
               cs.status as subscription_status,
               sp.name as plan_name,
               (SELECT COUNT(*) FROM patients WHERE clinic_id = c.id) as patient_count,
               (SELECT COUNT(*) FROM users WHERE clinic_id = c.id) as user_count,
               COALESCE((SELECT SUM(amount_paid) FROM subscription_invoices WHERE clinic_id = c.id AND status = 'paid'), 0) as total_revenue
        FROM clinics c
        LEFT JOIN clinic_subscriptions cs ON c.id = cs.clinic_id
        LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
        ORDER BY c.created_at DESC
      `;
    } else {
      query = `
        SELECT c.*, 
               cs.status as subscription_status,
               sp.name as plan_name,
               (SELECT COUNT(*) FROM patients WHERE clinic_id = c.id) as patient_count,
               (SELECT COUNT(*) FROM users WHERE clinic_id = c.id) as user_count,
               COALESCE((SELECT SUM(amount_paid) FROM subscription_invoices WHERE clinic_id = c.id AND status = 'paid'), 0) as total_revenue
        FROM clinics c
        LEFT JOIN clinic_subscriptions cs ON c.id = cs.clinic_id
        LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
        WHERE c.id = $1
        ORDER BY c.created_at DESC
      `;
      params = [req.user.clinicId];
    }

    const { rows } = await pool.query(query, params);
    res.json({ clinics: rows });
  } catch (err) {
    console.error('Get clinics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending clinic approvals
router.get('/clinics/pending', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT c.*, 
             u.full_name as admin_name,
             u.email as admin_email
      FROM clinics c
      LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'admin'
      WHERE c.status = 'pending'
      ORDER BY c.created_at DESC
    `);
    res.json({ clinics: rows });
  } catch (err) {
    console.error('Get pending clinics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve clinic
router.post('/clinics/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(`
      UPDATE clinics SET status = 'active', approved_at = NOW() WHERE id = $1
    `, [req.params.id]);

    res.json({ success: true, message: 'Clinic approved successfully' });
  } catch (err) {
    console.error('Approve clinic error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject clinic
router.post('/clinics/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { reason } = req.body;
    await pool.query(`
      UPDATE clinics SET status = 'rejected', rejection_reason = $1 WHERE id = $2
    `, [reason || 'Not specified', req.params.id]);

    res.json({ success: true, message: 'Clinic rejected' });
  } catch (err) {
    console.error('Reject clinic error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// CREATE CLINIC
// ============================================================
router.post('/clinics', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Only super admin can create clinics' });
    }

    const { name, email, phone, city, country, address, plan } = req.body;

    const clinicResult = await pool.query(`
      INSERT INTO clinics (name, email, phone, city, country, address, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
      RETURNING *
    `, [name, email, phone, city, country, address]);

    const clinic = clinicResult.rows[0];

    const planResult = await pool.query(`
      SELECT id FROM subscription_plans WHERE name = $1
    `, [plan || 'Basic']);

    if (planResult.rows.length > 0) {
      await pool.query(`
        INSERT INTO clinic_subscriptions (clinic_id, plan_id, status, trial_end_date, created_at, updated_at)
        VALUES ($1, $2, 'trialing', NOW() + INTERVAL '14 days', NOW(), NOW())
      `, [clinic.id, planResult.rows[0].id]);
    }

    res.json({ success: true, clinic });
  } catch (err) {
    console.error('Create clinic error:', err);
    res.status(500).json({ error: 'Failed to create clinic' });
  }
});

// ============================================================
// SUSPEND CLINIC 
// ============================================================
router.post('/clinics/:id/suspend', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(`
      UPDATE clinics SET status = 'suspended', updated_at = NOW() WHERE id = $1
    `, [req.params.id]);

    // Use 'canceled' for subscription since 'suspended' may not be allowed
    await pool.query(`
      UPDATE clinic_subscriptions SET status = 'canceled', updated_at = NOW() WHERE clinic_id = $1
    `, [req.params.id]);

    res.json({ success: true, message: 'Clinic suspended successfully' });
  } catch (err) {
    console.error('Suspend clinic error:', err);
    res.status(500).json({ error: 'Failed to suspend clinic' });
  }
});

// ============================================================
// ACTIVATE CLINIC
// ============================================================
router.post('/clinics/:id/activate', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(`
      UPDATE clinics SET status = 'active', updated_at = NOW() WHERE id = $1
    `, [req.params.id]);

    await pool.query(`
      UPDATE clinic_subscriptions SET status = 'active', updated_at = NOW() WHERE clinic_id = $1
    `, [req.params.id]);

    res.json({ success: true, message: 'Clinic activated successfully' });
  } catch (err) {
    console.error('Activate clinic error:', err);
    res.status(500).json({ error: 'Failed to activate clinic' });
  }
});

// ============================================================
// UPDATE CLINIC
// ============================================================
router.put('/clinics/:id', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, phone, city, country, address } = req.body;

    await pool.query(`
      UPDATE clinics 
      SET name = $1, email = $2, phone = $3, city = $4, country = $5, address = $6, updated_at = NOW()
      WHERE id = $7
    `, [name, email, phone, city, country, address, req.params.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Update clinic error:', err);
    res.status(500).json({ error: 'Failed to update clinic' });
  }
});

// ============================================================
// GET SINGLE CLINIC DETAILS (with staff)
// ============================================================
router.get('/clinics/:id', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && req.params.id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [clinicResult, staffResult] = await Promise.all([
      pool.query(`
        SELECT c.*, 
               cs.status as subscription_status,
               cs.trial_end_date,
               cs.current_period_end,
               sp.name as plan_name, 
               sp.features, 
               sp.limits,
               (SELECT COUNT(*) FROM patients WHERE clinic_id = c.id) as patient_count,
               (SELECT COUNT(*) FROM users WHERE clinic_id = c.id) as user_count,
               (SELECT COUNT(*) FROM appointments WHERE clinic_id = c.id) as appointment_count,
               COALESCE((SELECT SUM(amount_paid) FROM subscription_invoices WHERE clinic_id = c.id AND status = 'paid'), 0) as total_revenue,
               (SELECT json_agg(row_to_json(si)) FROM (
                 SELECT * FROM subscription_invoices 
                 WHERE clinic_id = c.id 
                 ORDER BY created_at DESC 
                 LIMIT 10
               ) si) as recent_invoices
        FROM clinics c
        LEFT JOIN clinic_subscriptions cs ON c.id = cs.clinic_id
        LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
        WHERE c.id = $1
      `, [req.params.id]),
      pool.query(`
        SELECT id, full_name, email, role, is_active, last_active, created_at
        FROM users
        WHERE clinic_id = $1
        ORDER BY created_at DESC
      `, [req.params.id])
    ]);

    if (!clinicResult.rows.length) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const clinic = clinicResult.rows[0];
    clinic.staff = staffResult.rows;

    res.json({ clinic });
  } catch (err) {
    console.error('Get clinic error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// CLINIC PATIENTS
// ============================================================
router.get('/clinics/:id/patients', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && req.params.id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT id, full_name, phone, email, date_of_birth, gender, 
             created_at as last_visit, patient_number
      FROM patients 
      WHERE clinic_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [req.params.id]);

    res.json({ patients: rows });
  } catch (err) {
    console.error('Get clinic patients error:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// ============================================================
// CLINIC APPOINTMENTS
// ============================================================
router.get('/clinics/:id/appointments', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && req.params.id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT a.id, a.scheduled_at as date, a.status, a.type,
             p.full_name as patient_name,
             u.full_name as doctor_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.clinic_id = $1
      ORDER BY a.scheduled_at DESC
      LIMIT 50
    `, [req.params.id]);

    res.json({ appointments: rows });
  } catch (err) {
    console.error('Get clinic appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============================================================
// CLINIC TREATMENTS
// ============================================================
router.get('/clinics/:id/treatments', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && req.params.id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT 
        t.id, 
        t.created_at as treatment_date, 
        t.is_completed as status,
        t.treatment_notes as notes,
        p.full_name as patient_name,
        u.full_name as doctor_name,
        NULL as procedure
      FROM treatments t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN users u ON t.doctor_id = u.id
      WHERE p.clinic_id = $1
      ORDER BY t.created_at DESC 
      LIMIT 50
    `, [req.params.id]);

    res.json({ treatments: rows });
  } catch (err) {
    console.error('Get clinic treatments error:', err);
    res.status(500).json({ error: 'Failed to fetch treatments' });
  }
});

// ============================================================
// CLINIC PRESCRIPTIONS
// ============================================================
router.get('/clinics/:id/prescriptions', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && req.params.id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT 
        pr.id, 
        pr.medication_name as medication, 
        pr.dosage, 
        pr.frequency, 
        pr.status, 
        pr.prescribed_at as created_at,
        p.full_name as patient_name,
        u.full_name as doctor_name
      FROM prescriptions pr
      LEFT JOIN patients p ON pr.patient_id = p.id
      LEFT JOIN users u ON pr.doctor_id = u.id
      WHERE p.clinic_id = $1
      ORDER BY pr.prescribed_at DESC 
      LIMIT 50
    `, [req.params.id]);

    res.json({ prescriptions: rows });
  } catch (err) {
    console.error('Get clinic prescriptions error:', err);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// ============================================================
// CLINIC LAB ORDERS
// ============================================================
router.get('/clinics/:id/lab-orders', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && req.params.id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT l.id, l.order_type as type, l.lab_name as lab, l.status, l.created_at,
             p.full_name as patient_name
      FROM lab_orders l
      LEFT JOIN patients p ON l.patient_id = p.id
      WHERE l.clinic_id = $1
      ORDER BY l.created_at DESC
      LIMIT 50
    `, [req.params.id]);

    res.json({ labOrders: rows });
  } catch (err) {
    console.error('Get clinic lab orders error:', err);
    res.status(500).json({ error: 'Failed to fetch lab orders' });
  }
});

// ============================================================
// CLINIC INVENTORY
// ============================================================
router.get('/clinics/:id/inventory', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && req.params.id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT 
        id, 
        name as item_name, 
        category, 
        quantity_in_stock as stock,
        minimum_stock_level as min_level, 
        unit, 
        COALESCE(status, 'available') as status
      FROM inventory_items 
      WHERE clinic_id = $1 
      ORDER BY name 
      LIMIT 50
    `, [req.params.id]);

    res.json({ inventory: rows });
  } catch (err) {
    console.error('Get clinic inventory error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// ============================================================
// CLINIC STAFF
// ============================================================
router.get('/clinics/:id/staff', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user) && req.params.id !== req.user.clinicId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT id, full_name, email, role, is_active, last_active, created_at
      FROM users
      WHERE clinic_id = $1
      ORDER BY created_at DESC
    `, [req.params.id]);

    res.json({ staff: rows });
  } catch (err) {
    console.error('Get clinic staff error:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// ============================================================
// USERS
// ============================================================
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.role, u.is_active, 
             u.created_at, u.last_active, c.name as clinic_name
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// ANALYTICS
// ============================================================
router.get('/analytics', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { period = 'month' } = req.query;

    const revenueResult = await pool.query(`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM subscription_invoices
      WHERE status = 'paid'
    `);

    const mrrResult = await pool.query(`
      SELECT COALESCE(SUM(amount_paid), 0) as mrr
      FROM subscription_invoices
      WHERE status = 'paid' 
        AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    const subsResult = await pool.query(`
      SELECT COUNT(*) as total FROM clinic_subscriptions WHERE status = 'active'
    `);

    res.json({
      revenue: parseFloat(revenueResult.rows[0]?.total || 0),
      mrr: parseFloat(mrrResult.rows[0]?.mrr || 0),
      subscriptions: parseInt(subsResult.rows[0]?.total || 0),
      growth: 12.5
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// USAGE METRICS
// ============================================================
router.get('/usage', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const clinicsResult = await pool.query(`SELECT COUNT(*) as total FROM clinics`);
    const activeResult = await pool.query(`
      SELECT COUNT(*) as total FROM clinic_subscriptions WHERE status = 'active'
    `);
    const usersResult = await pool.query(`
      SELECT COUNT(*) as total FROM users WHERE last_active > NOW() - INTERVAL '5 minutes'
    `);
    const dbSizeResult = await pool.query(`SELECT pg_database_size(current_database()) as size`);

    res.json({
      apiCalls: 124500,
      storage: parseFloat((parseInt(dbSizeResult.rows[0]?.size || 0) / 1024 / 1024 / 1024).toFixed(2)),
      bandwidth: 156,
      activeUsers: parseInt(usersResult.rows[0]?.total || 0),
      requestsPerMinute: 42,
      clinics: {
        total: parseInt(clinicsResult.rows[0]?.total || 0),
        active: parseInt(activeResult.rows[0]?.total || 0)
      }
    });
  } catch (err) {
    console.error('Usage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// FEATURE REQUESTS
// ============================================================
router.get('/feature-requests', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ requests: [] });
  } catch (err) {
    console.error('Feature requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/feature-requests', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    await pool.query(`
      INSERT INTO feature_requests (clinic_id, title, description, priority, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW())
    `, [req.user.clinicId, title, description, priority || 'medium']);
    res.json({ success: true, message: 'Feature request submitted' });
  } catch (err) {
    console.error('Create feature request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/feature-requests/:id', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { status } = req.body;
    await pool.query(`
      UPDATE feature_requests SET status = $1, updated_at = NOW() WHERE id = $2
    `, [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update feature request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// REVENUE
// ============================================================
router.get('/revenue', auth, adminOnly, async (req, res) => {
  try {
    let clinicFilter = '';
    let params = [];

    if (!isSuperAdmin(req.user)) {
      clinicFilter = 'AND clinic_id = $1';
      params = [req.user.clinicId];
    }

    const monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', paid_at) as month,
        SUM(amount_paid) as revenue,
        COUNT(*) as invoice_count
      FROM subscription_invoices
      WHERE status = 'paid' ${clinicFilter}
      GROUP BY DATE_TRUNC('month', paid_at)
      ORDER BY month DESC
      LIMIT 12
    `;

    const { rows: monthlyRows } = await pool.query(monthlyQuery, params);

    const mrrQuery = `
      SELECT 
        COUNT(DISTINCT clinic_id) as total_paying_clinics,
        SUM(amount_paid) as mrr
      FROM subscription_invoices
      WHERE status = 'paid' 
        AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
        ${clinicFilter}
    `;

    const { rows: statsRows } = await pool.query(mrrQuery, params);

    const totalQuery = `
      SELECT COALESCE(SUM(amount_paid), 0) as total_revenue
      FROM subscription_invoices
      WHERE status = 'paid' ${clinicFilter}
    `;

    const { rows: totalRows } = await pool.query(totalQuery, params);

    res.json({
      monthly: monthlyRows,
      mrr: parseFloat(statsRows[0]?.mrr || 0),
      total: parseFloat(totalRows[0]?.total_revenue || 0),
      periodRevenue: parseFloat(statsRows[0]?.mrr || 0),
      newSubscriptions: 0,
      churnRate: 0
    });
  } catch (err) {
    console.error('Get revenue error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// HEALTH
// ============================================================
router.get('/health', auth, adminOnly, async (req, res) => {
  try {
    if (isSuperAdmin(req.user)) {
      const [dbSize, activeConnections] = await Promise.all([
        pool.query(`SELECT pg_database_size(current_database()) as size`),
        pool.query(`SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'`),
      ]);

      res.json({
        database: {
          sizeBytes: parseInt(dbSize.rows[0]?.size || 0),
          sizeMB: (parseInt(dbSize.rows[0]?.size || 0) / 1024 / 1024).toFixed(2),
          connections: parseInt(activeConnections.rows[0]?.count || 0),
        },
        uptime: process.uptime(),
        memory: {
          usageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          totalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        environment: {
          nodeVersion: process.version,
          mode: process.env.NODE_ENV || 'development',
        }
      });
    } else {
      res.json({
        database: { status: 'connected' },
        uptime: process.uptime(),
        environment: {
          nodeVersion: process.version,
          mode: process.env.NODE_ENV || 'development',
        }
      });
    }
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// SUPPORT TICKETS
// ============================================================
router.get('/tickets', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      const { rows } = await pool.query(`
        SELECT t.*, c.name as clinic
        FROM support_tickets t
        LEFT JOIN clinics c ON t.clinic_id = c.id
        WHERE t.clinic_id = $1
        ORDER BY t.created_at DESC
      `, [req.user.clinicId]);
      return res.json({ tickets: rows });
    }

    const { rows } = await pool.query(`
      SELECT t.*, c.name as clinic
      FROM support_tickets t
      LEFT JOIN clinics c ON t.clinic_id = c.id
      ORDER BY 
        CASE t.status 
          WHEN 'open' THEN 1 
          WHEN 'in-progress' THEN 2 
          WHEN 'resolved' THEN 3 
          ELSE 4 
        END,
        t.created_at DESC
    `);
    res.json({ tickets: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// ============================================================
// PAYMENTS
// ============================================================
router.get('/payments', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      const { rows } = await pool.query(`
        SELECT p.*, inv.invoice_number
        FROM payments p
        LEFT JOIN invoices inv ON p.invoice_id = inv.id
        WHERE inv.clinic_id = $1
        ORDER BY p.paid_at DESC
        LIMIT 50
      `, [req.user.clinicId]);
      return res.json({ payments: rows });
    }

    const { rows } = await pool.query(`
      SELECT p.*, inv.invoice_number, c.name as clinic
      FROM payments p
      LEFT JOIN invoices inv ON p.invoice_id = inv.id
      LEFT JOIN clinics c ON inv.clinic_id = c.id
      ORDER BY p.paid_at DESC
      LIMIT 50
    `);
    res.json({ payments: rows });
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ============================================================
// INVOICES
// ============================================================
router.get('/invoices', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      const { rows } = await pool.query(`
        SELECT i.*, sp.name as plan
        FROM subscription_invoices i
        LEFT JOIN clinic_subscriptions cs ON i.clinic_id = cs.clinic_id
        LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
        WHERE i.clinic_id = $1
        ORDER BY i.created_at DESC
        LIMIT 50
      `, [req.user.clinicId]);
      return res.json({ invoices: rows });
    }

    const { rows } = await pool.query(`
      SELECT i.*, c.name as clinic, sp.name as plan
      FROM subscription_invoices i
      LEFT JOIN clinics c ON i.clinic_id = c.id
      LEFT JOIN clinic_subscriptions cs ON i.clinic_id = cs.clinic_id
      LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
      ORDER BY i.created_at DESC
      LIMIT 50
    `);
    res.json({ invoices: rows });
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// ============================================================
// AUDIT LOGS
// ============================================================
router.get('/audit-logs', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      const { rows } = await pool.query(`
        SELECT 
          id, 
          action, 
          table_name as target, 
          ip_address as ip,
          created_at,
          COALESCE(user_id::text, 'system') as actor
        FROM audit_logs 
        WHERE clinic_id = $1
        ORDER BY created_at DESC
        LIMIT 100
      `, [req.user.clinicId]);
      return res.json({ logs: rows });
    }

    const { rows } = await pool.query(`
      SELECT 
        id, 
        action, 
        table_name as target, 
        ip_address as ip,
        created_at,
        COALESCE(user_id::text, 'system') as actor,
        clinic_id
      FROM audit_logs 
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({ logs: rows });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ============================================================
// PLATFORM SETTINGS
// ============================================================
router.get('/settings', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      const { rows } = await pool.query(`
        SELECT * FROM clinic_settings WHERE clinic_id = $1
      `, [req.user.clinicId]);
      return res.json({ settings: rows[0] || {} });
    }

    const { rows } = await pool.query(`
      SELECT * FROM platform_settings LIMIT 1
    `);
    res.json({ settings: rows[0] || {} });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', auth, adminOnly, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Only super admin can update platform settings' });
    }

    const { platform_name, support_email, billing_email, maintenance_mode, registration_open } = req.body;

    await pool.query(`
      UPDATE platform_settings 
      SET 
        platform_name = COALESCE($1, platform_name),
        support_email = COALESCE($2, support_email),
        billing_email = COALESCE($3, billing_email),
        maintenance_mode = COALESCE($4, maintenance_mode),
        registration_open = COALESCE($5, registration_open),
        updated_at = NOW()
      WHERE id = (SELECT id FROM platform_settings LIMIT 1)
    `, [platform_name, support_email, billing_email, maintenance_mode, registration_open]);

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============================================================
// GET ALL SUBSCRIPTIONS (for super admin)
// ============================================================
router.get('/subscriptions', auth, adminOnly, async (req, res) => {
  try {
    let query;
    let params = [];

    if (isSuperAdmin(req.user)) {
      query = `
        SELECT 
          cs.id,
          c.id as clinic_id,
          c.name as clinic_name,
          sp.name as plan_name,
          cs.status,
          cs.current_period_start as start_date,
          cs.current_period_end as renewal_date,
          sp.price_monthly as amount,
          c.email
        FROM clinic_subscriptions cs
        JOIN clinics c ON cs.clinic_id = c.id
        JOIN subscription_plans sp ON cs.plan_id = sp.id
        ORDER BY cs.created_at DESC
      `;
    } else {
      query = `
        SELECT 
          cs.id,
          c.id as clinic_id,
          c.name as clinic_name,
          sp.name as plan_name,
          cs.status,
          cs.current_period_start as start_date,
          cs.current_period_end as renewal_date,
          sp.price_monthly as amount,
          c.email
        FROM clinic_subscriptions cs
        JOIN clinics c ON cs.clinic_id = c.id
        JOIN subscription_plans sp ON cs.plan_id = sp.id
        WHERE c.id = $1
        ORDER BY cs.created_at DESC
      `;
      params = [req.user.clinicId];
    }

    const { rows } = await pool.query(query, params);
    res.json({ subscriptions: rows });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// ============================================================
// GET ACTIVE SUBSCRIPTION FOR CURRENT CLINIC
// ============================================================
router.get('/subscriptions/active', auth, async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    const { rows } = await pool.query(`
      SELECT cs.*, sp.name as plan_name, sp.price_monthly
      FROM clinic_subscriptions cs
      JOIN subscription_plans sp ON cs.plan_id = sp.id
      WHERE cs.clinic_id = $1 AND cs.status = 'active'
      LIMIT 1
    `, [clinicId]);

    res.json({ subscription: rows[0] || null });
  } catch (err) {
    console.error('Get active subscription error:', err);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// ============================================================
// SUBSCRIBE TO PLAN (create or update)
// ============================================================
router.post('/subscriptions/subscribe', auth, async (req, res) => {
  try {
    const { plan_id, billing_cycle } = req.body;
    const clinicId = req.user.clinicId;

    const existing = await pool.query(
      `SELECT id FROM clinic_subscriptions WHERE clinic_id = $1 AND status = 'active'`,
      [clinicId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE clinic_subscriptions 
         SET plan_id = $1, billing_cycle = $2, status = 'active', updated_at = NOW()
         WHERE clinic_id = $3`,
        [plan_id, billing_cycle || 'monthly', clinicId]
      );
    } else {
      await pool.query(
        `INSERT INTO clinic_subscriptions (clinic_id, plan_id, status, billing_cycle, current_period_start, current_period_end, created_at, updated_at)
         VALUES ($1, $2, 'active', $3, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW())`,
        [clinicId, plan_id, billing_cycle || 'monthly']
      );
    }

    res.json({ success: true, message: 'Subscription activated' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// ============================================================
// CANCEL SUBSCRIPTION
// ============================================================
router.post('/subscriptions/cancel', auth, async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    await pool.query(
      `UPDATE clinic_subscriptions 
       SET status = 'canceled', cancel_at_period_end = true, updated_at = NOW()
       WHERE clinic_id = $1 AND status = 'active'`,
      [clinicId]
    );

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel' });
  }
});

// ============================================================
// UPGRADE/DOWNGRADE SUBSCRIPTION
// ============================================================
router.post('/subscriptions/:id/change-plan', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_id, billing_cycle } = req.body;

    await pool.query(
      `UPDATE clinic_subscriptions 
       SET plan_id = $1, 
           billing_cycle = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [plan_id, billing_cycle || 'monthly', id]
    );

    res.json({ success: true, message: 'Plan updated successfully' });
  } catch (err) {
    console.error('Change plan error:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// ============================================================
// REACTIVATE SUBSCRIPTION
// ============================================================
router.post('/subscriptions/:id/reactivate', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE clinic_subscriptions 
       SET status = 'active', 
           cancel_at_period_end = false,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Subscription reactivated' });
  } catch (err) {
    console.error('Reactivate subscription error:', err);
    res.status(500).json({ error: 'Failed to reactivate' });
  }
});

// ============================================================
// GET PLANS FROM DATABASE
// ============================================================
router.get('/plans', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, price_monthly as price, 
             COALESCE(features, '[]') as features, 
             COALESCE(clinic_limit, 1) as "clinicLimit", 
             COALESCE(is_popular, false) as popular
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY price_monthly ASC
    `);
    res.json({ plans: rows });
  } catch (err) {
    console.error('Get plans error:', err);
    res.json({ plans: [] });
  }
});

// ============================================================
// GET MY SUBSCRIPTION
// ============================================================
router.get('/my-subscription', auth, async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    const { rows } = await pool.query(`
      SELECT cs.*, sp.name as plan_name, sp.price_monthly, 
             sp.features, COALESCE(sp.clinic_limit, 1) as clinic_limit,
             cs.current_period_end as renewal_date
      FROM clinic_subscriptions cs
      JOIN subscription_plans sp ON cs.plan_id = sp.id
      WHERE cs.clinic_id = $1 AND cs.status = 'active'
      LIMIT 1
    `, [clinicId]);

    res.json({ subscription: rows[0] || null });
  } catch (err) {
    console.error('Get my subscription error:', err);
    res.json({ subscription: null });
  }
});

module.exports = router;