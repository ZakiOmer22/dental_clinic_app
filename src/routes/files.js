const router = require("express").Router();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const pool = require("../db/pool");
const auth = require("../middleware/auth");

// ─────────────────────────────
// SECURITY LAYER (IMPORTANT)
// ─────────────────────────────
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

// ─────────────────────────────
// MULTER CONFIG
// ─────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

/**
 * UPLOAD FILE (SECURE PIPELINE)
 */
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { patientId, category = "other", toothNumber, description } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: "patientId required" });
    }

    // ─────────────────────────────
    // Convert buffer safely
    // ─────────────────────────────
    const base64 = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64}`;

    let uploadResult;

    try {
      uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: `clinic-${req.user.clinicId}/patient-${patientId}`,
        resource_type: "auto",

        // 🔐 IMPORTANT: prevent public abuse
        access_mode: "authenticated",
      });
    } catch (uploadErr) {
      console.error("Cloudinary error:", uploadErr);
      return res.status(500).json({ error: "File upload failed" });
    }

    // ─────────────────────────────
    // Save metadata in DB
    // ─────────────────────────────
    const result = await pool.query(
      `INSERT INTO patient_files
       (patient_id, uploaded_by, file_name, file_url, file_type,
        file_size_kb, category, tooth_number, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        patientId,
        req.user.id,
        req.file.originalname,
        uploadResult.secure_url,
        req.file.mimetype,
        Math.round(req.file.size / 1024),
        category,
        toothNumber || null,
        description || null,
      ]
    );

    return res.status(201).json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      file: result.rows[0],
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE FILE (SECURE)
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const fileRes = await pool.query(
      `SELECT file_url FROM patient_files WHERE id=$1`,
      [req.params.id]
    );

    if (!fileRes.rows[0]) {
      return res.status(404).json({ error: "Not found" });
    }

    const url = fileRes.rows[0].file_url;

    // safer public_id extraction
    const parts = url.split("/");
    const file = parts.pop();
    const publicId =
      parts.slice(-2).join("/") + "/" + file.split(".")[0];

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn("Cloudinary delete failed:", err.message);
    }

    await pool.query(
      `DELETE FROM patient_files WHERE id=$1`,
      [req.params.id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;