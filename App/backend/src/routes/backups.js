// ─────────────────────────────────────────────────────────────
// src/routes/backups.js 
// ─────────────────────────────────────────────────────────────

const router = require('express').Router();
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(require('child_process').exec);

// ─────────────────────────────────────────────────────────────
// BACKUP FOLDER
// ─────────────────────────────────────────────────────────────
const BACKUP_DIR = path.join(__dirname, '../../backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────────
// SETTINGS CACHE
// ─────────────────────────────────────────────────────────────
const settingsCache = new Map();

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getDbConfig = () => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return {
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      port: '5432',
      database: 'postgres'
    };
  }

  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = dbUrl.match(regex);

  if (!match) {
    return {
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      port: '5432',
      database: 'postgres'
    };
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
};

// ─────────────────────────────────────────────────────────────
// GET ALL BACKUPS
// ─────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql'));

    const backups = files.map((file, index) => {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);

      return {
        id: index + 1,
        filename: file,
        file_size: stats.size,
        created_at: stats.birthtime.toISOString(),
        type: file.includes('auto') ? 'automatic' : 'manual',
        status: 'completed'
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      data: backups,
      total: backups.length
    });

  } catch (err) {
    console.error(err);
    res.json({ data: [], total: 0 });
  }
});

// ─────────────────────────────────────────────────────────────
// CREATE REAL BACKUP (pg_dump)
// ─────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { type = 'manual' } = req.body;

    const db = getDbConfig();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${type}-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // 🔥 REAL BACKUP COMMAND
    const command = `PGPASSWORD="${db.password}" pg_dump -h ${db.host} -U ${db.user} -d ${db.database} -F p -f "${filepath}"`;

    await execPromise(command);

    const stats = fs.statSync(filepath);

    res.status(201).json({
      success: true,
      filename,
      file_size: stats.size,
      created_at: new Date().toISOString()
    });

  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({
      error: 'Backup failed. Ensure pg_dump is installed.'
    });
  }
});

// ─────────────────────────────────────────────────────────────
// DOWNLOAD BACKUP
// ─────────────────────────────────────────────────────────────
router.get('/:id/download', auth, (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql'));
    const index = parseInt(req.params.id) - 1;

    if (index < 0 || index >= files.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = files[index];
    res.download(path.join(BACKUP_DIR, file), file);

  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// RESTORE BACKUP (REAL)
// ─────────────────────────────────────────────────────────────
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql'));
    const index = parseInt(req.params.id) - 1;

    if (index < 0 || index >= files.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = files[index];
    const filepath = path.join(BACKUP_DIR, file);

    const db = getDbConfig();

    const command = `PGPASSWORD="${db.password}" psql -h ${db.host} -U ${db.user} -d ${db.database} -f "${filepath}"`;

    await execPromise(command);

    res.json({
      success: true,
      message: 'Database restored successfully'
    });

  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ error: 'Restore failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE BACKUP
// ─────────────────────────────────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql'));
    const index = parseInt(req.params.id) - 1;

    if (index < 0 || index >= files.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    fs.unlinkSync(path.join(BACKUP_DIR, files[index]));

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────
router.get('/settings', auth, (req, res) => {
  const clinicId = req.user.clinicId;

  if (settingsCache.has(clinicId)) {
    return res.json(settingsCache.get(clinicId));
  }

  const settings = {
    auto_backup_enabled: true,
    backup_frequency: 'daily',
    backup_time: '02:00',
    retention_days: 30
  };

  settingsCache.set(clinicId, settings);
  res.json(settings);
});

router.put('/settings', auth, (req, res) => {
  const clinicId = req.user.clinicId;

  settingsCache.set(clinicId, req.body);

  res.json(req.body);
});

// ─────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────
router.get('/status', auth, (req, res) => {
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql'));

  let totalSize = 0;

  files.forEach(f => {
    const stat = fs.statSync(path.join(BACKUP_DIR, f));
    totalSize += stat.size;
  });

  res.json({
    total_backups: files.length,
    total_size: formatFileSize(totalSize)
  });
});

module.exports = router;