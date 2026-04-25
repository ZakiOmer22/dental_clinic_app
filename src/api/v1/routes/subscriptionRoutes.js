const router = require('express').Router();
const auth = require('../../../middleware/auth');
const stripeService = require('../../../services/stripeService');
const pool = require('../../../db/pool');
const { requireFeature } = require('../middlewares/featureLimit');

// Get available plans (public)
router.get('/plans', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, code, description, price_monthly, price_yearly, features, limits
       FROM subscription_plans
       WHERE is_active = true AND is_public = true
       ORDER BY sort_order`
    );
    
    res.json({ plans: rows });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current subscription (requires auth)
router.get('/current', auth, async (req, res) => {
  try {
    const status = await stripeService.getSubscriptionStatus(req.user.clinicId);
    res.json(status);
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create checkout session
router.post('/checkout', auth, async (req, res) => {
  try {
    const { planCode, successUrl, cancelUrl } = req.body;
    
    const session = await stripeService.createCheckoutSession(
      req.user.clinicId,
      planCode,
      successUrl || `${process.env.FRONTEND_URL}/settings/billing?success=true`,
      cancelUrl || `${process.env.FRONTEND_URL}/settings/billing?canceled=true`
    );
    
    res.json(session);
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get billing portal URL
router.post('/portal', auth, async (req, res) => {
  try {
    const { returnUrl } = req.body;
    
    const url = await stripeService.createBillingPortalSession(
      req.user.clinicId,
      returnUrl || `${process.env.FRONTEND_URL}/settings/billing`
    );
    
    res.json({ url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const { cancelImmediately } = req.body;
    
    await stripeService.cancelSubscription(req.user.clinicId, cancelImmediately);
    
    res.json({
      success: true,
      message: cancelImmediately ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end',
    });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get invoices
router.get('/invoices', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM subscription_invoices
       WHERE clinic_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.clinicId]
    );
    
    res.json({ invoices: rows });
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment methods
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const methods = await stripeService.getPaymentMethods(req.user.clinicId);
    res.json({ methods });
  } catch (err) {
    console.error('Get payment methods error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get upcoming invoice
router.get('/upcoming-invoice', auth, async (req, res) => {
  try {
    const invoice = await stripeService.getUpcomingInvoice(req.user.clinicId);
    res.json({ invoice });
  } catch (err) {
    console.error('Get upcoming invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get usage stats
router.get('/usage', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM clinic_usage
       WHERE clinic_id = $1
       ORDER BY date DESC
       LIMIT 30`,
      [req.user.clinicId]
    );
    
    // Get current counts
    const [usersResult, patientsResult, appointmentsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM users WHERE clinic_id = $1 AND is_active = true`, [req.user.clinicId]),
      pool.query(`SELECT COUNT(*) as count FROM patients WHERE clinic_id = $1 AND is_active = true`, [req.user.clinicId]),
      pool.query(`SELECT COUNT(*) as count FROM appointments WHERE clinic_id = $1 AND DATE(scheduled_at) = CURRENT_DATE`, [req.user.clinicId]),
    ]);
    
    const limits = await pool.query(
      `SELECT sp.limits FROM clinic_subscriptions cs
       JOIN subscription_plans sp ON cs.plan_id = sp.id
       WHERE cs.clinic_id = $1`,
      [req.user.clinicId]
    );
    
    res.json({
      usage: rows,
      current: {
        users: parseInt(usersResult.rows[0].count),
        patients: parseInt(patientsResult.rows[0].count),
        todayAppointments: parseInt(appointmentsResult.rows[0].count),
      },
      limits: limits.rows[0]?.limits || { max_users: 5, max_patients: 500 },
    });
  } catch (err) {
    console.error('Get usage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;