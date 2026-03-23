// ─────────────────────────────────────────────────────────────────────────────
// src/routes/staff.js
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

const bcrypt = require('bcryptjs');
 
router.get('/', auth, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const params = [req.user.clinicId];
    let where = 'clinic_id = $1';
    if (role)   { params.push(role);         where += ` AND role = $${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`; }
    params.push(Number(limit), (Number(page)-1)*Number(limit));
 
    const { rows } = await pool.query(
      `SELECT id,clinic_id,full_name,email,role,phone,gender,specialization,license_number,hire_date,avatar_url,is_active,last_login_at,created_at
       FROM users WHERE ${where} ORDER BY full_name LIMIT $${params.length-1} OFFSET $${params.length}`, params
    );
    const count = await pool.query(`SELECT COUNT(*) FROM users WHERE ${where}`, params.slice(0,-2));
    res.json({ data: rows, total: Number(count.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,clinic_id,full_name,email,role,phone,gender,specialization,license_number,hire_date,avatar_url,is_active,last_login_at,created_at FROM users WHERE id=$1 AND clinic_id=$2`,
      [req.params.id, req.user.clinicId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.post('/', auth, async (req, res) => {
  try {
    const { fullName, email, password, role, phone, gender, specialization, licenseNumber, hireDate } = req.body;
    if (!fullName || !email || !password || !role) return res.status(400).json({ error: 'fullName, email, password and role required' });
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (clinic_id,full_name,email,password_hash,role,phone,gender,specialization,license_number,hire_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id,clinic_id,full_name,email,role,phone,gender,specialization,is_active,created_at`,
      [req.user.clinicId, fullName, email.toLowerCase().trim(), hash, role, phone||null, gender||null, specialization||null, licenseNumber||null, hireDate||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.put('/:id', auth, async (req, res) => {
  try {
    const { fullName, phone, gender, specialization, licenseNumber, hireDate, role } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET full_name=$1,phone=$2,gender=$3,specialization=$4,license_number=$5,hire_date=$6,role=$7,updated_at=NOW()
       WHERE id=$8 AND clinic_id=$9 RETURNING id,full_name,email,role,phone,is_active`,
      [fullName, phone||null, gender||null, specialization||null, licenseNumber||null, hireDate||null, role, req.params.id, req.user.clinicId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET is_active=$1,updated_at=NOW() WHERE id=$2 AND clinic_id=$3 RETURNING id,full_name,is_active',
      [isActive, req.params.id, req.user.clinicId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.patch('/:id/password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2 AND clinic_id=$3', [hash, req.params.id, req.user.clinicId]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.delete('/:id', auth, async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    await pool.query('UPDATE users SET is_active=FALSE,updated_at=NOW() WHERE id=$1 AND clinic_id=$2', [req.params.id, req.user.clinicId]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
module.exports = router;