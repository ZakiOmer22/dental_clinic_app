const router = require('express').Router();
const auth = require('../../../middleware/auth');
const pool = require('../../../db/pool');
const telesomService = require('../../../services/telesomService');
const edahabService = require('../../../services/edahabService');

// Get available payment gateways
router.get('/gateways', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT gateway, is_active, 
         CASE WHEN credentials ? 'senderId' THEN true ELSE false END as is_configured
       FROM payment_gateways
       WHERE clinic_id = $1`,
      [req.user.clinicId]
    );
    
    const available = [
      { id: 'stripe', name: 'Stripe (International Cards)', configured: true },
      { id: 'telesom', name: 'Telesom (Somaliland)', configured: rows.some(r => r.gateway === 'telesom') },
      { id: 'edahab', name: 'eDahab (Somalia)', configured: rows.some(r => r.gateway === 'edahab') },
    ];
    
    res.json({ gateways: available });
  } catch (err) {
    console.error('Get gateways error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Configure Telesom
router.post('/telesom/configure', auth, async (req, res) => {
  try {
    const { senderId, username, password } = req.body;
    
    await pool.query(
      `INSERT INTO payment_gateways (clinic_id, gateway, credentials, is_active)
       VALUES ($1, 'telesom', $2, true)
       ON CONFLICT (clinic_id, gateway) DO UPDATE SET
         credentials = $2, updated_at = NOW()`,
      [req.user.clinicId, JSON.stringify({ senderId, username, password })]
    );
    
    res.json({ success: true, message: 'Telesom configured successfully' });
  } catch (err) {
    console.error('Configure Telesom error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Configure eDahab
router.post('/edahab/configure', auth, async (req, res) => {
  try {
    const { merchantId, apiKey } = req.body;
    
    await pool.query(
      `INSERT INTO payment_gateways (clinic_id, gateway, credentials, is_active)
       VALUES ($1, 'edahab', $2, true)
       ON CONFLICT (clinic_id, gateway) DO UPDATE SET
         credentials = $2, updated_at = NOW()`,
      [req.user.clinicId, JSON.stringify({ merchantId, apiKey })]
    );
    
    res.json({ success: true, message: 'eDahab configured successfully' });
  } catch (err) {
    console.error('Configure eDahab error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send test SMS
router.post('/telesom/test', auth, async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    const result = await telesomService.sendSMS(
      req.user.clinicId,
      phone,
      message || 'Test message from Daryeel App — Multi-Clinic Dental SaaS Platform'
    );
    
    res.json({ success: true, result });
  } catch (err) {
    console.error('Test SMS error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check Telesom balance
router.get('/telesom/balance', auth, async (req, res) => {
  try {
    const balance = await telesomService.checkBalance(req.user.clinicId);
    res.json(balance);
  } catch (err) {
    console.error('Balance check error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Process eDahab payment
router.post('/edahab/pay', auth, async (req, res) => {
  try {
    const { amount, phoneNumber, description, planId } = req.body;
    
    let result;
    if (planId) {
      result = await edahabService.processSubscriptionPayment(
        req.user.clinicId,
        planId,
        phoneNumber
      );
    } else {
      result = await edahabService.createPayment(
        req.user.clinicId,
        amount,
        phoneNumber,
        description || 'Dental Clinic Payment'
      );
    }
    
    res.json({ success: true, result });
  } catch (err) {
    console.error('eDahab payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify eDahab payment
router.post('/edahab/verify/:transactionId', auth, async (req, res) => {
  try {
    const result = await edahabService.verifyPayment(
      req.user.clinicId,
      req.params.transactionId
    );
    
    res.json({ success: true, result });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;