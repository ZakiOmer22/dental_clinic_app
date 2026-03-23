// ─────────────────────────────────────────────────────────────────────────────
// src/routes/files.js
// ─────────────────────────────────────────────────────────────────────────────
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB
const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const { patientId, category = 'other', toothNumber, description } = req.body;
    if (!patientId) return res.status(400).json({ error: 'patientId required' });

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `dental-portal/clinic-${req.user.clinicId}/patient-${patientId}`,
      resource_type: 'auto',
    });

    const { rows } = await pool.query(
      `INSERT INTO patient_files (patient_id,uploaded_by,file_name,file_url,file_type,file_size_kb,category,tooth_number,description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patientId, req.user.id, req.file.originalname, result.secure_url, req.file.mimetype, Math.round(req.file.size / 1024), category, toothNumber || null, description || null]
    );
    res.status(201).json({ url: result.secure_url, publicId: result.public_id, file: rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT file_url FROM patient_files WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    // Extract Cloudinary public_id from URL and delete
    const parts = rows[0].file_url.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts.slice(-3, -1).join('/');
    try { await cloudinary.uploader.destroy(`${folder}/${filename}`); } catch (_) { }
    await pool.query('DELETE FROM patient_files WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;