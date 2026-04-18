const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

/**
 * GET financial settings
 */
router.get('/settings', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, currency, timezone
       FROM clinics
       WHERE id = $1`,
      [req.user.clinicId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const c = result.rows[0];

    res.json({
      data: {
        clinic_id: c.id,
        clinic_name: c.name,
        currency: c.currency || 'SOS',
        timezone: c.timezone || 'Africa/Nairobi',
        date_format: 'DD/MM/YYYY',
        fiscal_year: 'jan-dec',
        decimal_places: 2,
        rounding: 'half_up',
        invoice_prefix: 'INV-',
        next_invoice_number: 1001,
        default_due_days: 30,
        late_fee_percent: 0,
        invoice_template: 'modern',
        accounting_method: 'accrual',
        accounts: {
          revenue: '4000',
          expense: '5000',
          asset: '1000',
          liability: '2000',
        },
      },
    });
  } catch (err) {
    console.error('Financial settings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * UPDATE financial settings
 */
router.put('/settings', auth, async (req, res) => {
  try {
    const {
      currency,
      date_format,
      fiscal_year,
      decimal_places,
      rounding,
      invoice_prefix,
      next_invoice_number,
      default_due_days,
      late_fee_percent,
      invoice_template,
      accounting_method,
    } = req.body;

    if (currency) {
      await pool.query(
        `UPDATE clinics
         SET currency = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [currency, req.user.clinicId]
      );
    }

    const result = await pool.query(
      `SELECT id, name, currency, timezone
       FROM clinics
       WHERE id = $1`,
      [req.user.clinicId]
    );

    const c = result.rows[0];

    res.json({
      data: {
        clinic_id: c.id,
        clinic_name: c.name,
        currency: c.currency || 'SOS',
        timezone: c.timezone || 'Africa/Nairobi',
        date_format: date_format || 'DD/MM/YYYY',
        fiscal_year: fiscal_year || 'jan-dec',
        decimal_places: decimal_places ?? 2,
        rounding: rounding || 'half_up',
        invoice_prefix: invoice_prefix || 'INV-',
        next_invoice_number: next_invoice_number || 1001,
        default_due_days: default_due_days || 30,
        late_fee_percent: late_fee_percent || 0,
        invoice_template: invoice_template || 'modern',
        accounting_method: accounting_method || 'accrual',
      },
    });
  } catch (err) {
    console.error('Financial update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * TAXES (static for now)
 */
router.get('/taxes', auth, async (req, res) => {
  res.json({
    data: [
      { id: 1, name: 'No Tax', rate: 0, type: 'sales', is_active: true },
      { id: 2, name: 'Sales Tax', rate: 5, type: 'sales', is_active: false },
      { id: 3, name: 'VAT', rate: 10, type: 'vat', is_active: false },
      { id: 4, name: 'GST', rate: 18, type: 'gst', is_active: false },
    ],
  });
});

router.post('/taxes', auth, async (req, res) => {
  const { name, rate, type, is_active } = req.body;

  res.status(201).json({
    data: {
      id: Date.now(),
      name,
      rate,
      type,
      is_active,
      created_at: new Date(),
    },
  });
});

router.put('/taxes/:id', auth, async (req, res) => {
  res.json({
    data: {
      id: Number(req.params.id),
      ...req.body,
      updated_at: new Date(),
    },
  });
});

router.delete('/taxes/:id', auth, async (req, res) => {
  res.json({ ok: true });
});

/**
 * PAYMENT TERMS (static mock)
 */
router.get('/payment-terms', auth, async (req, res) => {
  res.json({
    data: [
      { id: 1, name: 'Cash', days: 0, discount_percent: 0, is_default: false },
      { id: 2, name: 'Net 7', days: 7, discount_percent: 0, is_default: false },
      { id: 3, name: 'Net 15', days: 15, discount_percent: 2, is_default: false },
      { id: 4, name: 'Net 30', days: 30, discount_percent: 0, is_default: true },
      { id: 5, name: 'Net 60', days: 60, discount_percent: 0, is_default: false },
    ],
  });
});

router.post('/payment-terms', auth, async (req, res) => {
  res.status(201).json({
    data: {
      id: Date.now(),
      ...req.body,
    },
  });
});

router.put('/payment-terms/:id', auth, async (req, res) => {
  res.json({
    data: {
      id: Number(req.params.id),
      ...req.body,
    },
  });
});

router.delete('/payment-terms/:id', auth, async (req, res) => {
  res.json({ ok: true });
});

module.exports = router;