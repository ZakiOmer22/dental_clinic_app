const router = require('express').Router();
const pool = require('../../../db/pool');
const auth = require('../../../middleware/auth');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse } = require('../../../../utils/responseHandler');

router.use(auth);

router.get('/files', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, patient_id, file_name, file_url, file_type, file_size_kb, category, uploaded_at
     FROM patient_files
     ORDER BY uploaded_at DESC
     LIMIT 50`
  );

  const { rows: countRows } = await pool.query(`SELECT COUNT(*) as total FROM patient_files`);
  
  return res.json({
    success: true,
    data: rows.map(row => ({
      ...row,
      name: row.file_name,
      fileName: row.file_name,
      file_name: row.file_name,
      type: row.file_type,
      fileType: row.file_type,
      file_type: row.file_type,
      size: (row.file_size_kb || 0) * 1024,
      file_size_kb: row.file_size_kb,
      fileSizeKb: row.file_size_kb,
      humanSize: row.file_size_kb >= 1024 
        ? `${(row.file_size_kb / 1024).toFixed(1)} MB` 
        : `${row.file_size_kb} KB`,
      category: row.category || 'Other',
      uploaded_at: row.uploaded_at,
      uploadedAt: row.uploaded_at,
      last_accessed: row.uploaded_at,
      url: row.file_url,
      fileUrl: row.file_url,
      file_url: row.file_url,
    })),
    total: parseInt(countRows[0].total),
  });
}));

router.post('/cleanup', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `DELETE FROM patient_files 
     WHERE is_archived = true 
       AND uploaded_at < NOW() - INTERVAL '90 days'
     RETURNING id, file_size_kb`
  );

  const filesRemoved = rows.length;
  const spaceFreed = rows.reduce((sum, r) => sum + (r.file_size_kb || 0), 0);

  return res.json({
    success: true,
    message: `Removed ${filesRemoved} archived files`,
    data: { filesRemoved, spaceFreedKb: spaceFreed },
  });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT 
       COUNT(*) as total_files,
       COALESCE(SUM(file_size_kb), 0) as used_storage_kb,
       COUNT(CASE WHEN uploaded_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_files,
       COUNT(CASE WHEN is_archived = true THEN 1 END) as archived_files
     FROM patient_files`
  );

  const stats = rows[0];
  const usedBytes = parseInt(stats.used_storage_kb) * 1024;
  const storageLimitGb = 5; // Default Basic plan
  const totalBytes = storageLimitGb * 1024 * 1024 * 1024;

  return res.json({
    success: true,
    total: totalBytes,
    used: usedBytes,
    free: Math.max(0, totalBytes - usedBytes),
    totalFiles: parseInt(stats.total_files),
    usedStorageKb: parseInt(stats.used_storage_kb),
    usedStorageMb: (parseInt(stats.used_storage_kb) / 1024).toFixed(2),
    storageLimitGb: storageLimitGb,
    recentFiles: parseInt(stats.recent_files),
    archivedFiles: parseInt(stats.archived_files),
    byType: {},
  });
}));

module.exports = router;