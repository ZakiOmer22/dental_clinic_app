
// ─────────────────────────────────────────────────────────────────────────────
// src/routes/notifications.js
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { isRead, type, page = 1, limit = 50 } = req.query;
    const params = [req.user.clinicId];
    let where = '(clinic_id = $1 OR user_id = $2)';
    params.push(req.user.id);
    if (isRead !== undefined) { params.push(isRead === 'true'); where += ` AND is_read = $${params.length}`; }
    if (type)  { params.push(type); where += ` AND type = $${params.length}`; }
    params.push(Number(limit), (Number(page)-1)*Number(limit));
 
    const [rows, unread] = await Promise.all([
      pool.query(`SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      pool.query(`SELECT COUNT(*) FROM notifications WHERE (clinic_id=$1 OR user_id=$2) AND is_read=FALSE`, [req.user.clinicId, req.user.id]),
    ]);
    res.json({ data: rows.rows, unread: Number(unread.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.get('/unread-count', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE (clinic_id=$1 OR user_id=$2) AND is_read=FALSE`,
      [req.user.clinicId, req.user.id]
    );
    res.json({ count: Number(rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE notifications SET is_read=TRUE WHERE id=$1 RETURNING *', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.patch('/read-all', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read=TRUE WHERE (clinic_id=$1 OR user_id=$2) AND is_read=FALSE`,
      [req.user.clinicId, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
 
module.exports = router;