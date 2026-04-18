
// ─────────────────────────────────────────────────────────────────────────────
// src/routes/settings.js
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.put('/clinic', auth, async (req, res) => {
  try {
    const {
      name, phone, email,
      address, city,
      currency, timezone, logoUrl
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Clinic name required' });
    }

    const { rows } = await pool.query(
      `UPDATE clinics SET
        name=$1,
        phone=$2,
        email=$3,
        address=$4,
        city=$5,
        currency=$6,
        timezone=$7,
        logo_url=$8,
        updated_at=NOW()
       WHERE id=$9
       RETURNING *`,
      [
        name,
        phone || null,
        email || null,
        address || null,
        city || null,
        currency || 'USD',
        timezone || 'Africa/Nairobi',
        logoUrl || null,
        req.user.clinicId
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;