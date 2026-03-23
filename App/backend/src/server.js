require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const cloudinary = require('cloudinary').v2;
const pool       = require('./db/pool');

// ── Cloudinary ───────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// ── Security & Parsing ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ───────────────────────────────────────────────────────
app.use('/auth',          require('./routes/auth'));
app.use('/patients',      require('./routes/patients'));
app.use('/appointments',  require('./routes/appointments'));
app.use('/treatments',    require('./routes/treatments'));
app.use('/billing',       require('./routes/billing'));
app.use('/expenses',      require('./routes/expenses'));
app.use('/prescriptions', require('./routes/prescriptions'));
app.use('/lab-orders',    require('./routes/labOrder'));
app.use('/consent-forms', require('./routes/consentForms'));
app.use('/referrals',     require('./routes/referrals'));
app.use('/inventory',     require('./routes/inventory'));
app.use('/notifications', require('./routes/notifications'));
app.use('/reports',       require('./routes/reports'));
app.use('/staff',         require('./routes/staff'));
app.use('/files',         require('./routes/files'));
app.use('/procedures',    require('./routes/procedures'));
app.use('/rooms',         require('./routes/rooms'));
app.use('/settings',      require('./routes/settings'));
app.use('/recall',        require('./routes/recall'));
app.use('/audit-logs',    require('./routes/audit'));
app.use('/users',         require('./routes/users'));
app.use('/backups',         require('./routes/backups'));
app.use('/tickets',         require('./routes/tickets'));
app.use('/knowledge-base',  require('./routes/knowledgeBase'));
app.use('/feedback',        require('./routes/feedback'));

// ── Health check — pinged by UptimeRobot to keep Railway awake ──
app.get('/health', (_req, res) => {
  res.json({
    ok:       true,
    ts:       Date.now(),
    env:      process.env.NODE_ENV,
    db:       process.env.DATABASE_URL        ? '✅' : '❌',
    jwt:      process.env.JWT_SECRET          ? '✅' : '❌',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌',
  });
});

// ── 404 ──────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`\n🦷 Dental Portal API running on port ${PORT}`);
  console.log(`   ENV:        ${process.env.NODE_ENV}`);
  console.log(`   Frontend:   ${process.env.FRONTEND_URL}`);
  console.log(`   DB:         ${process.env.DATABASE_URL        ? '✅ configured' : '❌ MISSING'}`);
  console.log(`   JWT:        ${process.env.JWT_SECRET          ? '✅ configured' : '❌ MISSING'}`);
  console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ configured' : '❌ MISSING'}`);

  // Verify DB connection on startup
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to Neon PostgreSQL');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
});