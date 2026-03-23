const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /procedures - List all procedures with pagination and filters
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, is_active, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [req.user.clinicId];
    let whereClause = 'WHERE clinic_id = $1';
    
    // Add filters
    if (is_active === 'true') {
      whereClause += ' AND is_active = true';
    } else if (is_active === 'false') {
      whereClause += ' AND is_active = false';
    } else {
      whereClause += ' AND is_active = true'; // default to active only
    }
    
    if (category && category !== 'all') {
      params.push(category);
      whereClause += ` AND category = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR cdt_code ILIKE $${params.length})`;
    }
    
    // Get total count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM procedures ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);
    
    // Get paginated results
    params.push(Number(limit), offset);
    const { rows } = await pool.query(
      `SELECT 
        id, 
        name, 
        cdt_code, 
        category, 
        base_price, 
        duration_minutes, 
        description,
        requires_lab,
        is_active,
        created_at
       FROM procedures 
       ${whereClause}
       ORDER BY category, name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    
    res.json({ 
      data: rows, 
      total, 
      page: Number(page), 
      limit: Number(limit) 
    });
  } catch (err) {
    console.error('Error fetching procedures:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /procedures/categories - Get distinct procedure categories
router.get('/categories', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT category 
       FROM procedures 
       WHERE clinic_id = $1 AND is_active = true
       ORDER BY category`,
      [req.user.clinicId]
    );
    res.json(rows.map(r => r.category));
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /procedures/category/:category - Get procedures by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id, name, cdt_code, category, base_price, 
        duration_minutes, description, requires_lab
       FROM procedures 
       WHERE clinic_id = $1 AND category = $2 AND is_active = true
       ORDER BY name`,
      [req.user.clinicId, req.params.category]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Error fetching procedures by category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /procedures/:id - Get single procedure by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        id, name, cdt_code, category, base_price, 
        duration_minutes, description, requires_lab, is_active
       FROM procedures 
       WHERE id = $1 AND clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Procedure not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching procedure:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /procedures - Create new procedure
router.post('/', auth, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      cdt_code, 
      base_price, 
      duration_minutes, 
      description, 
      requires_lab 
    } = req.body;
    
    // Validation
    if (!name || !category || base_price === undefined) {
      return res.status(400).json({ 
        error: 'Name, category, and base price are required' 
      });
    }
    
    if (isNaN(base_price) || base_price < 0) {
      return res.status(400).json({ error: 'Base price must be a positive number' });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO procedures 
         (clinic_id, name, category, cdt_code, base_price, 
          duration_minutes, description, requires_lab, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, name, category, cdt_code, base_price, 
                 duration_minutes, description, requires_lab, is_active, created_at`,
      [
        req.user.clinicId, 
        name, 
        category, 
        cdt_code || null, 
        base_price, 
        duration_minutes || 30, 
        description || null, 
        requires_lab || false
      ]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating procedure:', err);
    
    // Check for duplicate CDT code
    if (err.code === '23505' && err.constraint === 'procedures_cdt_code_key') {
      return res.status(400).json({ error: 'CDT code already exists' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /procedures/:id - Update procedure
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      cdt_code, 
      base_price, 
      duration_minutes, 
      description, 
      requires_lab,
      is_active 
    } = req.body;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (cdt_code !== undefined) {
      updates.push(`cdt_code = $${paramCount++}`);
      values.push(cdt_code);
    }
    if (base_price !== undefined) {
      if (isNaN(base_price) || base_price < 0) {
        return res.status(400).json({ error: 'Base price must be a positive number' });
      }
      updates.push(`base_price = $${paramCount++}`);
      values.push(base_price);
    }
    if (duration_minutes !== undefined) {
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(duration_minutes);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (requires_lab !== undefined) {
      updates.push(`requires_lab = $${paramCount++}`);
      values.push(requires_lab);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id, req.user.clinicId);
    
    const { rows } = await pool.query(
      `UPDATE procedures 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND clinic_id = $${paramCount}
       RETURNING id, name, category, cdt_code, base_price, 
                 duration_minutes, description, requires_lab, is_active`,
      values
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Procedure not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating procedure:', err);
    
    // Check for duplicate CDT code
    if (err.code === '23505' && err.constraint === 'procedures_cdt_code_key') {
      return res.status(400).json({ error: 'CDT code already exists' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /procedures/:id/toggle - Toggle procedure active status
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE procedures 
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND clinic_id = $2
       RETURNING id, name, is_active`,
      [req.params.id, req.user.clinicId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Procedure not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error toggling procedure status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /procedures/:id - Soft delete procedure
router.delete('/:id', auth, async (req, res) => {
  try {
    // First check if procedure is used in any treatment
    const usageCheck = await pool.query(
      `SELECT COUNT(*) as usage_count 
       FROM treatment_procedures 
       WHERE procedure_id = $1`,
      [req.params.id]
    );
    
    if (parseInt(usageCheck.rows[0].usage_count) > 0) {
      // If used, just deactivate instead of delete
      await pool.query(
        `UPDATE procedures 
         SET is_active = false, updated_at = NOW()
         WHERE id = $1 AND clinic_id = $2`,
        [req.params.id, req.user.clinicId]
      );
    } else {
      // If never used, we can hard delete
      await pool.query(
        `DELETE FROM procedures 
         WHERE id = $1 AND clinic_id = $2`,
        [req.params.id, req.user.clinicId]
      );
    }
    
    res.json({ ok: true, message: 'Procedure removed successfully' });
  } catch (err) {
    console.error('Error deleting procedure:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /procedures/stats/summary - Get procedure statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_procedures,
        COUNT(DISTINCT category) as total_categories,
        AVG(base_price) as avg_price,
        MIN(base_price) as min_price,
        MAX(base_price) as max_price,
        COUNT(CASE WHEN requires_lab THEN 1 END) as lab_required_count
       FROM procedures 
       WHERE clinic_id = $1 AND is_active = true`,
      [req.user.clinicId]
    );
    
    const categoryBreakdown = await pool.query(
      `SELECT 
        category, 
        COUNT(*) as count,
        AVG(base_price) as avg_category_price
       FROM procedures 
       WHERE clinic_id = $1 AND is_active = true
       GROUP BY category
       ORDER BY count DESC`,
      [req.user.clinicId]
    );
    
    res.json({
      summary: stats.rows[0],
      byCategory: categoryBreakdown.rows
    });
  } catch (err) {
    console.error('Error fetching procedure stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /procedures/bulk-import - Bulk import procedures
router.post('/bulk-import', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { procedures } = req.body;
    
    if (!Array.isArray(procedures) || procedures.length === 0) {
      return res.status(400).json({ error: 'Invalid procedures data' });
    }
    
    await client.query('BEGIN');
    
    const inserted = [];
    for (const proc of procedures) {
      const { name, category, cdt_code, base_price, duration_minutes, description, requires_lab } = proc;
      
      if (!name || !category || base_price === undefined) {
        throw new Error('Missing required fields');
      }
      
      const { rows } = await client.query(
        `INSERT INTO procedures 
           (clinic_id, name, category, cdt_code, base_price, 
            duration_minutes, description, requires_lab, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (clinic_id, cdt_code) 
         DO UPDATE SET 
           name = EXCLUDED.name,
           base_price = EXCLUDED.base_price,
           updated_at = NOW()
         RETURNING id, name, cdt_code`,
        [req.user.clinicId, name, category, cdt_code || null, base_price,
         duration_minutes || 30, description || null, requires_lab || false]
      );
      
      inserted.push(rows[0]);
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      message: `Successfully imported ${inserted.length} procedures`,
      data: inserted 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error bulk importing procedures:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;