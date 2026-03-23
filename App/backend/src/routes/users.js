// ─────────────────────────────────────────────────────────────
// src/routes/users.js
// ─────────────────────────────────────────────────────────────

const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Simple SELECT matching your actual schema
const USER_SELECT = `
  SELECT 
    id, 
    full_name, 
    email, 
    phone, 
    role, 
    is_active,  -- Use is_active directly, not as status
    clinic_id, 
    last_login_at,
    created_at, 
    updated_at
  FROM users
`;

// GET /users
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching users for clinic:', req.user.clinicId);
    
    const { role, status, search, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [req.user.clinicId];
    let where = 'WHERE clinic_id = $1';

    if (role) {
      params.push(role);
      where += ` AND role = $${params.length}`;
    }
    
    // Fix: Use is_active instead of status
    if (status === 'active') {
      where += ` AND is_active = true`;
    } else if (status === 'inactive') {
      where += ` AND is_active = false`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (full_name ILIKE $${params.length} 
          OR email ILIKE $${params.length} 
          OR phone ILIKE $${params.length})`;
    }

    // Get total count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);
    
    console.log('Total users found:', total);

    // Get paginated results
    params.push(Number(limit), offset);
    const { rows } = await pool.query(
      `${USER_SELECT} ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    console.log('Returning users:', rows.length);

    // Transform the response to include status field for frontend compatibility
    const transformedRows = rows.map(user => ({
      ...user,
      status: user.is_active ? 'active' : 'inactive'
    }));

    res.json({ 
      data: transformedRows, 
      total, 
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    console.error('ERROR in GET /users:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: err.message
    });
  }
});

// GET /users/me
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id, 
        full_name, 
        email, 
        phone, 
        role, 
        is_active,
        clinic_id, 
        created_at
       FROM users WHERE id = $1 AND clinic_id = $2`,
      [req.user.id, req.user.clinicId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Transform to include status
    const user = {
      ...rows[0],
      status: rows[0].is_active ? 'active' : 'inactive'
    };
    
    res.json(user);
  } catch (err) {
    console.error('Error in GET /users/me:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /users/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id, 
        full_name, 
        email, 
        phone, 
        role, 
        is_active,
        clinic_id, 
        created_at, 
        updated_at
       FROM users WHERE id = $1 AND clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Transform to include status
    const user = {
      ...rows[0],
      status: rows[0].is_active ? 'active' : 'inactive'
    };
    
    res.json(user);
  } catch (err) {
    console.error('Error in GET /users/:id:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users
router.post('/', auth, async (req, res) => {
  try {
    const { full_name, email, password, phone, role, is_active = true } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email and password required' });
    }

    // Check if email already exists in this clinic
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND clinic_id = $2',
      [email, req.user.clinicId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users
         (clinic_id, full_name, email, password_hash, phone, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, phone, role, is_active, created_at`,
      [req.user.clinicId, full_name, email, hash, phone || null, role || 'receptionist', is_active]
    );

    // Transform to include status
    const user = {
      ...rows[0],
      status: rows[0].is_active ? 'active' : 'inactive'
    };

    res.status(201).json(user);
  } catch (err) {
    console.error('Error in POST /users:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /users/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { full_name, email, phone, role, is_active } = req.body;

    // Check if email exists for another user
    if (email) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2 AND clinic_id = $3',
        [email, req.params.id, req.user.clinicId]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         role = COALESCE($4, role),
         is_active = COALESCE($5, is_active),
         updated_at = NOW()
       WHERE id = $6 AND clinic_id = $7
       RETURNING id, full_name, email, phone, role, is_active, updated_at`,
      [full_name, email, phone, role, is_active, req.params.id, req.user.clinicId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Transform to include status
    const user = {
      ...rows[0],
      status: rows[0].is_active ? 'active' : 'inactive'
    };
    
    res.json(user);
  } catch (err) {
    console.error('Error in PUT /users/:id:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH /users/:id/toggle-status
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    const { is_active } = req.body;

    const { rows } = await pool.query(
      `UPDATE users SET is_active = $1, updated_at = NOW()
       WHERE id = $2 AND clinic_id = $3
       RETURNING id, full_name, email, role, is_active`,
      [is_active, req.params.id, req.user.clinicId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Transform to include status
    const user = {
      ...rows[0],
      status: rows[0].is_active ? 'active' : 'inactive'
    };
    
    res.json(user);
  } catch (err) {
    console.error('Error in PATCH /users/:id/toggle-status:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// POST /users/:id/reset-password
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, email FROM users WHERE id = $1 AND clinic_id = $2',
      [req.params.id, req.user.clinicId]
    );

    if (!userCheck.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 
                        Math.random().toString(36).slice(-8).toUpperCase();
    const hash = await bcrypt.hash(tempPassword, 12);

    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW()
       WHERE id = $2 AND clinic_id = $3`,
      [hash, req.params.id, req.user.clinicId]
    );

    // TODO: Send email with temporary password
    res.json({ 
      success: true, 
      message: 'Password reset successful',
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
    });
  } catch (err) {
    console.error('Error in POST /users/:id/reset-password:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// DELETE /users/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND clinic_id = $2',
      [req.params.id, req.user.clinicId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /users/:id:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;