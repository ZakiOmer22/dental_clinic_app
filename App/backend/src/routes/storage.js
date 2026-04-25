const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

// =====================
// SAFE CONFIG
// =====================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// =====================
// MULTER SAFETY
// =====================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB safer limit
});

// =====================
// UPLOAD
// =====================
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `clinics/${req.user.clinicId}`,
                    resource_type: 'auto'
                },
                (err, result) => err ? reject(err) : resolve(result)
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        const saved = await pool.query(
            `INSERT INTO storage_files
             (clinic_id, name, path, size, mime_type, uploaded_by, cloudinary_public_id, cloudinary_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [
                req.user.clinicId,
                req.file.originalname,
                result.secure_url,
                req.file.size,
                req.file.mimetype,
                req.user.id,
                result.public_id,
                result.secure_url
            ]
        );

        res.json(saved.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// =====================
// CLEANUP (SAFE VERSION)
// =====================
router.post('/cleanup', async (req, res) => {
    try {
        const days = Math.min(parseInt(req.body.days || 30), 365);

        const { rows } = await pool.query(
            `SELECT * FROM storage_files
             WHERE clinic_id=$1
             AND last_accessed < NOW() - ($2 || ' days')::interval`,
            [req.user.clinicId, days]
        );

        res.json({
            candidates: rows.length
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Cleanup failed' });
    }
});