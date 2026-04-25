const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

console.log('🪑 Rooms route loaded');

// GET test
router.get('/test', (req, res) => {
  res.json({ message: 'Rooms working', time: Date.now() });
});

// GET /rooms
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rooms WHERE clinic_id = $1 ORDER BY name`,
      [req.user.clinicId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /rooms
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, floor, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Room name required' });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO rooms (clinic_id, name, type, floor, notes, is_available)
      VALUES ($1,$2,$3,$4,$5,true)
      RETURNING *
      `,
      [req.user.clinicId, name, type || 'dental_chair', floor || null, notes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /rooms/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, floor, is_available, notes } = req.body;

    const { rows } = await pool.query(
      `
      UPDATE rooms
      SET name=$1, type=$2, floor=$3, is_available=$4, notes=$5
      WHERE id=$6 AND clinic_id=$7
      RETURNING *
      `,
      [name, type, floor, is_available, notes, req.params.id, req.user.clinicId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /rooms/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM rooms WHERE id=$1 AND clinic_id=$2`,
      [req.params.id, req.user.clinicId]
    );

    if (!rowCount) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;