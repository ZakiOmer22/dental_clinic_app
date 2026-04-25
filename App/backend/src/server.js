require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const cloudinary = require('cloudinary').v2;
const compression = require('compression');
const pool = require('./db/pool');

const app = express();

// IMPORTANT for Render / proxies
app.set('trust proxy', 1);

// ── Cloudinary ───────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Stripe webhook (MUST be before express.json) ──────────────────
const { webhookHandler } = require('./api/v1/controllers/webhookController');
app.post(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// ── Rate Limiting ────────────────────────────────────────────────
const isRateLimitDisabled = process.env.DISABLE_RATE_LIMIT === 'true';

if (!isRateLimitDisabled) {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  console.log(
    `✅ Rate limiting enabled: ${
      process.env.RATE_LIMIT_MAX_REQUESTS || 100
    } requests per ${
      (process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000) / 1000 / 60
    } minutes`
  );
} else {
  console.log('⚠️ Rate limiting DISABLED');
}

// ── Compression ─────────────────────────────────────────────────
app.use(
  compression({
    level: 6,
    threshold: 1024,
  })
);

// ── Security ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cookieParser());

// ── CORS (single, clean config) ───────────────────────────────────
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://192.168.1.4:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ─────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Route imports ────────────────────────────────────────────────
const subscriptionRoutes = require('./api/v1/routes/subscriptionRoutes');
const adminRoutes = require('./api/v1/routes/adminRoutes');
const paymentGatewayRoutes = require('./api/v1/routes/paymentGatewayRoutes');

// ── API Routes ──────────────────────────────────────────────────
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentGatewayRoutes);

// ── V1 Routes ───────────────────────────────────────────────────
app.use('/api/v1/auth', require('./api/v1/routes/authRoutes'));
app.use('/api/v1/patients', require('./api/v1/routes/patientRoutes'));
app.use('/api/v1/appointments', require('./api/v1/routes/appointmentRoutes'));
app.use('/api/v1/treatments', require('./api/v1/routes/treatmentRoutes'));
app.use('/api/v1/billing', require('./api/v1/routes/billingRoutes'));
app.use('/api/v1/prescriptions', require('./api/v1/routes/prescriptionRoutes'));
app.use('/api/v1/inventory', require('./api/v1/routes/inventoryRoutes'));
app.use('/api/v1/lab-orders', require('./api/v1/routes/labOrdersRoutes'));
app.use('/api/v1/expenses', require('./api/v1/routes/expenseRoutes'));
app.use('/api/v1/consent-forms', require('./api/v1/routes/consentFormRoutes'));
app.use('/api/v1/referrals', require('./api/v1/routes/referralRoutes'));
app.use('/api/v1/notifications', require('./api/v1/routes/notificationRoutes'));
app.use('/api/v1/reports', require('./api/v1/routes/reportRoutes'));
app.use('/api/v1/staff', require('./api/v1/routes/staffRoutes'));
app.use('/api/v1/storage', require('./api/v1/routes/storageRoutes'));
app.use('/api/v1/files', require('./api/v1/routes/fileRoutes'));
app.use('/api/v1/procedures', require('./api/v1/routes/procedureRoutes'));
app.use('/api/v1/rooms', require('./api/v1/routes/roomRoutes'));
app.use('/api/v1/settings', require('./api/v1/routes/settingsRoutes'));
app.use('/api/v1/recall', require('./api/v1/routes/recallRoutes'));
app.use('/api/v1/audit-logs', require('./api/v1/routes/auditRoutes'));
app.use('/api/v1/logs', require('./api/v1/routes/auditRoutes')); 
app.use('/api/v1/users', require('./api/v1/routes/userRoutes'));
app.use('/api/v1/backups', require('./api/v1/routes/backupRoutes'));
app.use('/api/v1/tickets', require('./api/v1/routes/ticketRoutes'));
app.use('/api/v1/knowledge-base', require('./api/v1/routes/knowledgeBaseRoutes'));
app.use('/api/v1/feedback', require('./api/v1/routes/feedbackRoutes'));
app.use('/api/v1/insurance', require('./api/v1/routes/insuranceRoutes'));
app.use('/api/v1/financial', require('./api/v1/routes/financialRoutes'));
app.use('/api/v1/logs', require('./api/v1/routes/auditRoutes')); 

// // ── Legacy Routes ────────────────────────────────────────────────
// app.use('/auth', require('./routes/auth'));
// app.use('/audit', require('./routes/audit'));
// app.use('/patients', require('./routes/patients'));
// app.use('/appointments', require('./routes/appointments'));
// app.use('/treatments', require('./routes/treatments'));
// app.use('/billing', require('./routes/billing'));
// app.use('/expenses', require('./routes/expenses'));
// app.use('/prescriptions', require('./routes/prescriptions'));
// app.use('/lab-orders', require('./routes/labOrder'));
// app.use('/consent-forms', require('./routes/consentForms'));
// app.use('/referrals', require('./routes/referrals'));
// app.use('/inventory', require('./routes/inventory'));
// app.use('/notifications', require('./routes/notifications'));
// app.use('/reports', require('./routes/reports'));
// app.use('/staff', require('./routes/staff'));
// app.use('/files', require('./routes/files'));
// app.use('/procedures', require('./routes/procedures'));
// app.use('/rooms', require('./routes/rooms'));
// app.use('/settings', require('./routes/settings'));
// app.use('/recall', require('./routes/recall'));
// app.use('/audit-logs', require('./routes/audit'));
// app.use('/users', require('./routes/users'));
// app.use('/backups', require('./routes/backups'));
// app.use('/tickets', require('./routes/tickets'));
// app.use('/knowledge-base', require('./routes/knowledgeBase'));
// app.use('/feedback', require('./routes/feedback'));
// app.use('/insurance', require('./routes/insurance'));
// app.use('/financial', require('./routes/financial'));


// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ── 404 ──────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ error: 'Route not found' })
);

// ── Global error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// ── Start server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);

  try {
    await pool.query('SELECT 1');
    console.log('✅ DB Connected');
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    console.error('❌ DB Error:', err.message);
  }
});