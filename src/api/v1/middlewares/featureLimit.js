const pool = require('../../../db/pool');

/**
 * Get clinic subscription with limits
 */
async function getClinicLimits(clinicId) {
  const { rows } = await pool.query(
    `SELECT cs.status, cs.trial_end_date, sp.limits, sp.features
     FROM clinic_subscriptions cs
     JOIN subscription_plans sp ON cs.plan_id = sp.id
     WHERE cs.clinic_id = $1`,
    [clinicId]
  );
  
  if (!rows.length) {
    // Default free tier limits
    return {
      status: 'trialing',
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      limits: { max_users: 5, max_patients: 500, storage_gb: 5 },
      features: ['appointments', 'patients', 'billing'],
    };
  }
  
  return rows[0];
}

/**
 * Check if clinic has feature access
 */
const requireFeature = (feature) => async (req, res, next) => {
  try {
    const limits = await getClinicLimits(req.user.clinicId);
    
    if (!limits.features || !limits.features.includes(feature)) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `The "${feature}" feature requires an upgraded plan.`,
        upgradeRequired: true,
      });
    }
    
    next();
  } catch (err) {
    console.error('Feature check error:', err);
    next();
  }
};

/**
 * Check resource limit
 */
const checkLimit = (resource) => async (req, res, next) => {
  try {
    const limits = await getClinicLimits(req.user.clinicId);
    const limit = limits.limits?.[`max_${resource}`];
    
    if (limit === undefined || limit === -1) {
      return next();
    }
    
    let currentUsage;
    
    switch (resource) {
      case 'users':
        const usersResult = await pool.query(
          `SELECT COUNT(*) as count FROM users WHERE clinic_id = $1 AND is_active = true`,
          [req.user.clinicId]
        );
        currentUsage = parseInt(usersResult.rows[0].count);
        break;
        
      case 'patients':
        const patientsResult = await pool.query(
          `SELECT COUNT(*) as count FROM patients WHERE clinic_id = $1 AND is_active = true`,
          [req.user.clinicId]
        );
        currentUsage = parseInt(patientsResult.rows[0].count);
        break;
        
      default:
        return next();
    }
    
    if (currentUsage >= limit) {
      return res.status(403).json({
        error: 'Limit reached',
        message: `You've reached the maximum ${resource} limit (${limit}).`,
        current: currentUsage,
        limit,
        upgradeRequired: true,
      });
    }
    
    req.resourceLimits = { current: currentUsage, limit };
    next();
  } catch (err) {
    console.error('Limit check error:', err);
    next();
  }
};

/**
 * Track usage
 */
const trackUsage = (resource) => async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const today = new Date().toISOString().split('T')[0];
      
      pool.query(
        `INSERT INTO clinic_usage (clinic_id, date, ${resource}_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (clinic_id, date) DO UPDATE SET
           ${resource}_count = clinic_usage.${resource}_count + 1`,
        [req.user?.clinicId, today]
      ).catch(() => {});
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  requireFeature,
  checkLimit,
  trackUsage,
  getClinicLimits,
};