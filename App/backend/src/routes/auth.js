const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');
const auth    = require('../middleware/auth');

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await pool.query(
      `SELECT id, clinic_id, full_name, email, password_hash, role, is_active
       FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.is_active) return res.status(403).json({ error: 'Account is disabled' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Update last login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const payload = { id: user.id, clinicId: user.clinic_id, role: user.role, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({
      token,
      user: {
        id:        user.id,
        clinicId:  user.clinic_id,
        fullName:  user.full_name,
        email:     user.email,
        role:      user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/register  (admin only in prod — open for first setup)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, clinicId } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (clinic_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, clinic_id, full_name, email, role`,
      [clinicId || 1, fullName, email.toLowerCase().trim(), hash, role || 'receptionist']
    );

    res.status(201).json({ user: rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/logout
router.post('/logout', auth, (req, res) => {
  // JWT is stateless — client just drops the token
  res.json({ ok: true });
});

// GET /auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, clinic_id, full_name, email, role, avatar_url FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
