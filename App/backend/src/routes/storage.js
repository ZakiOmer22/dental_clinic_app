// ─────────────────────────────────────────────────────────────
// src/routes/storage.js - CLOUDINARY VERSION
// ─────────────────────────────────────────────────────────────

const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');
const pool = require('../db/pool');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (for Cloudinary uploads)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'application/x-sql',
            'application/sql'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Helper to determine file type
const getFileType = (mimeType, filename) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sql') || filename.includes('.sql')) return 'backup';
    return 'other';
};

// Helper to format size
const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// Auth middleware
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Verify token and get user
        // Replace with your actual auth logic
        const decoded = verifyToken(token); // Your token verification
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.use(authenticate);

/**
 * GET /storage/stats - Get storage stats from Cloudinary
 */
router.get('/stats', async (req, res) => {
    try {
        // Get all files for this clinic from database
        const { rows } = await pool.query(
            `SELECT * FROM storage_files 
             WHERE clinic_id = $1 
             AND deleted_at IS NULL`,
            [req.user.clinicId]
        );

        let totalSize = 0;
        const byType = {
            image: 0,
            pdf: 0,
            document: 0,
            backup: 0,
            other: 0
        };

        rows.forEach(file => {
            totalSize += file.size;
            byType[file.type] = (byType[file.type] || 0) + file.size;
        });

        // Get Cloudinary account stats
        const cloudinaryStats = await cloudinary.api.usage();

        // Cloudinary free tier limits (adjust based on your plan)
        const totalLimit = 25 * 1024 * 1024 * 1024; // 25GB free tier

        res.json({
            total: totalLimit,
            used: totalSize,
            free: totalLimit - totalSize,
            byType,
            fileCount: rows.length,
            usedPercent: Math.round((totalSize / totalLimit) * 100),
            cloudinary: {
                plan: cloudinaryStats.plan,
                credits: cloudinaryStats.credits,
                usage: cloudinaryStats.usage
            },
            formatted: {
                total: formatSize(totalLimit),
                used: formatSize(totalSize),
                free: formatSize(totalLimit - totalSize)
            }
        });
    } catch (err) {
        console.error('Error in GET /storage/stats:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /storage/files - Get all files from database
 */
router.get('/files', async (req, res) => {
    try {
        const { type, page = 1, limit = 50 } = req.query;

        let query = `SELECT * FROM storage_files 
                     WHERE clinic_id = $1 
                     AND deleted_at IS NULL`;
        const params = [req.user.clinicId];
        let paramCount = 1;

        if (type && type !== 'all') {
            paramCount++;
            query += ` AND type = $${paramCount}`;
            params.push(type);
        }

        query += ` ORDER BY uploaded_at DESC 
                   LIMIT $${paramCount + 1} 
                   OFFSET $${paramCount + 2}`;

        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const { rows } = await pool.query(query, params);

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM storage_files 
             WHERE clinic_id = $1 
             AND deleted_at IS NULL`,
            [req.user.clinicId]
        );

        res.json({
            data: rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
        });
    } catch (err) {
        console.error('Error in GET /storage/files:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /storage/upload - Upload file to Cloudinary
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const fileType = getFileType(file.mimetype, file.originalname);

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `clinics/${req.user.clinicId}`,
                    public_id: `${Date.now()}-${file.originalname}`,
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });

        // Save to database
        const { rows } = await pool.query(
            `INSERT INTO storage_files 
             (clinic_id, name, path, type, mime_type, size, 
              uploaded_by, cloudinary_public_id, cloudinary_url, 
              uploaded_at, last_accessed)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
             RETURNING *`,
            [
                req.user.clinicId,
                file.originalname,
                result.secure_url,
                fileType,
                file.mimetype,
                file.size,
                req.user.id,
                result.public_id,
                result.secure_url
            ]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error uploading to Cloudinary:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /storage/files/:id - Delete file from Cloudinary and DB
 */
router.delete('/files/:id', async (req, res) => {
    try {
        // Get file from database
        const { rows } = await pool.query(
            `SELECT * FROM storage_files 
             WHERE id = $1 AND clinic_id = $2 AND deleted_at IS NULL`,
            [req.params.id, req.user.clinicId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = rows[0];

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(file.cloudinary_public_id);
        } catch (cloudinaryErr) {
            console.error('Error deleting from Cloudinary:', cloudinaryErr);
            // Continue with DB deletion even if Cloudinary fails
        }

        // Soft delete from database
        await pool.query(
            `UPDATE storage_files 
             SET deleted_at = NOW(), deleted_by = $1 
             WHERE id = $2`,
            [req.user.id, req.params.id]
        );

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /storage/files/:id/download - Get file URL
 */
router.get('/files/:id/download', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM storage_files 
             WHERE id = $1 AND clinic_id = $2 AND deleted_at IS NULL`,
            [req.params.id, req.user.clinicId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = rows[0];

        // Update last accessed
        await pool.query(
            `UPDATE storage_files SET last_accessed = NOW() WHERE id = $1`,
            [req.params.id]
        );

        // Redirect to Cloudinary URL
        res.json({ url: file.cloudinary_url });
    } catch (err) {
        console.error('Error getting file:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /storage/cleanup - Clean up old files
 */
router.post('/cleanup', async (req, res) => {
    try {
        const { older_than_days = 30 } = req.body;

        // Find old files
        const { rows: oldFiles } = await pool.query(
            `SELECT * FROM storage_files 
             WHERE clinic_id = $1 
             AND deleted_at IS NULL
             AND last_accessed < NOW() - INTERVAL '${older_than_days} days'`,
            [req.user.clinicId]
        );

        let filesDeleted = 0;
        let spaceFreed = 0;

        for (const file of oldFiles) {
            try {
                // Delete from Cloudinary
                await cloudinary.uploader.destroy(file.cloudinary_public_id);

                // Soft delete from database
                await pool.query(
                    `UPDATE storage_files 
                     SET deleted_at = NOW(), deleted_by = $1 
                     WHERE id = $2`,
                    [req.user.id, file.id]
                );

                filesDeleted++;
                spaceFreed += file.size;
            } catch (err) {
                console.error(`Error deleting file ${file.id}:`, err);
            }
        }

        res.json({
            success: true,
            message: `Cleaned up ${filesDeleted} files`,
            filesDeleted,
            spaceFreed,
            formattedSpaceFreed: formatSize(spaceFreed)
        });
    } catch (err) {
        console.error('Error cleaning up:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /storage/search - Search files
 */
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const { rows } = await pool.query(
            `SELECT * FROM storage_files 
             WHERE clinic_id = $1 
             AND deleted_at IS NULL
             AND (name ILIKE $2 OR path ILIKE $2)
             ORDER BY uploaded_at DESC`,
            [req.user.clinicId, `%${q}%`]
        );

        res.json({
            data: rows,
            total: rows.length
        });
    } catch (err) {
        console.error('Error searching files:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;