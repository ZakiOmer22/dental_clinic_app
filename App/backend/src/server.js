require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const cloudinary = require('cloudinary').v2;
const pool = require('./db/pool');

const app = express();

// ✅ IMPORTANT for Render / proxies
app.set('trust proxy', 1);

// ── Cloudinary ───────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Rate Limiting Configuration ───────────────────────────────────
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
  console.log('⚠️ Rate limiting DISABLED (DISABLE_RATE_LIMIT=true)');
}

// ── Compression ─────────────────────────────────────────────────
const compression = require('compression');
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
}));
console.log('✅ Compression enabled');

// ── Security ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cookieParser());

// ✅ Strict CORS (important for production)
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Better logging in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Add after other route imports - FIXED PATHS
const subscriptionRoutes = require('./api/v1/routes/subscriptionRoutes');
const adminRoutes = require('./api/v1/routes/adminRoutes');
const { webhookHandler } = require('./api/v1/controllers/webhookController');

// Stripe webhook (needs raw body)
app.post('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }), webhookHandler);

const paymentGatewayRoutes = require('./api/v1/routes/paymentGatewayRoutes');
// You'll need to import edahabWebhookHandler or create it
// const { edahabWebhookHandler } = require('./api/v1/controllers/webhookController');

// Mount subscription routes
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentGatewayRoutes);
// eDahab webhook - uncomment when handler exists
// app.post('/api/v1/webhooks/edahab', express.json(), edahabWebhookHandler);

// Mount v1 API routes - FIXED PATHS (removed /src from paths)
const v1AuthRoutes = require('./api/v1/routes/authRoutes');
const v1PatientRoutes = require('./api/v1/routes/patientRoutes');
const v1AppointmentRoutes = require('./api/v1/routes/appointmentRoutes');
const v1TreatmentRoutes = require('./api/v1/routes/treatmentRoutes');
const v1BillingRoutes = require('./api/v1/routes/billingRoutes');
const v1PrescriptionRoutes = require('./api/v1/routes/prescriptionRoutes');
const v1InventoryRoutes = require('./api/v1/routes/inventoryRoutes');
const v1LabRoutes = require('./api/v1/routes/labRoutes');
const v1ExpenseRoutes = require('./api/v1/routes/expenseRoutes');
// const v1LabOrderRoutes = require('./api/v1/routes/labOrderRoutes');
// const v1ConsentFormRoutes = require('./api/v1/routes/consentFormRoutes');
// const v1ReferralRoutes = require('./api/v1/routes/referralRoutes');
// const v1NotificationRoutes = require('./api/v1/routes/notificationRoutes');
// const v1ReportRoutes = require('./api/v1/routes/reportRoutes');
// const v1StaffRoutes = require('./api/v1/routes/staffRoutes');
// const v1FileRoutes = require('./api/v1/routes/fileRoutes');
// const v1ProcedureRoutes = require('./api/v1/routes/procedureRoutes');
// const v1RoomRoutes = require('./api/v1/routes/roomRoutes');
// const v1SettingsRoutes = require('./api/v1/routes/settingsRoutes');
// const v1RecallRoutes = require('./api/v1/routes/recallRoutes');
// const v1AuditRoutes = require('./api/v1/routes/auditRoutes');
// const v1UserRoutes = require('./api/v1/routes/userRoutes');
// const v1BackupRoutes = require('./api/v1/routes/backupRoutes');
// const v1TicketRoutes = require('./api/v1/routes/ticketRoutes');
// const v1KnowledgeBaseRoutes = require('./api/v1/routes/knowledgeBaseRoutes');
// const v1FeedbackRoutes = require('./api/v1/routes/feedbackRoutes');
// const v1InsuranceRoutes = require('./api/v1/routes/insuranceRoutes');
// const v1FinancialRoutes = require('./api/v1/routes/financialRoutes');

// Mount v1 routes alongside existing (gradual migration)
app.use('/api/v1/auth', v1AuthRoutes);
app.use('/api/v1/patients', v1PatientRoutes);
app.use('/api/v1/appointments', v1AppointmentRoutes);
app.use('/api/v1/treatments', v1TreatmentRoutes);
app.use('/api/v1/billing', v1BillingRoutes);
app.use('/api/v1/prescriptions', v1PrescriptionRoutes);
app.use('/api/v1/inventory', v1InventoryRoutes);
app.use('/api/v1/lab', v1LabRoutes);
app.use('/api/v1/expenses', v1ExpenseRoutes);
// app.use('/api/v1/lab-orders', v1LabOrderRoutes);
// app.use('/api/v1/consent-forms', v1ConsentFormRoutes);
// app.use('/api/v1/referrals', v1ReferralRoutes);
// app.use('/api/v1/notifications', v1NotificationRoutes);
// app.use('/api/v1/reports', v1ReportRoutes);
// app.use('/api/v1/staff', v1StaffRoutes);
// app.use('/api/v1/files', v1FileRoutes);
// app.use('/api/v1/procedures', v1ProcedureRoutes);
// app.use('/api/v1/rooms', v1RoomRoutes);
// app.use('/api/v1/settings', v1SettingsRoutes);
// app.use('/api/v1/recall', v1RecallRoutes);
// app.use('/api/v1/audit-logs', v1AuditRoutes);
// app.use('/api/v1/users', v1UserRoutes);
// app.use('/api/v1/backups', v1BackupRoutes);
// app.use('/api/v1/tickets', v1TicketRoutes);
// app.use('/api/v1/knowledge-base', v1KnowledgeBaseRoutes);
// app.use('/api/v1/feedback', v1FeedbackRoutes);
// app.use('/api/v1/insurance', v1InsuranceRoutes);
// app.use('/api/v1/financial', v1FinancialRoutes);

// ── Routes ───────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/audit', require('./routes/audit'));
app.use('/patients', require('./routes/patients'));
app.use('/appointments', require('./routes/appointments'));
app.use('/treatments', require('./routes/treatments'));
app.use('/billing', require('./routes/billing'));
app.use('/expenses', require('./routes/expenses'));
app.use('/prescriptions', require('./routes/prescriptions'));
app.use('/lab-orders', require('./routes/labOrder'));
app.use('/consent-forms', require('./routes/consentForms'));
app.use('/referrals', require('./routes/referrals'));
app.use('/inventory', require('./routes/inventory'));
app.use('/notifications', require('./routes/notifications'));
app.use('/reports', require('./routes/reports'));
app.use('/staff', require('./routes/staff'));
app.use('/files', require('./routes/files'));
app.use('/procedures', require('./routes/procedures'));
app.use('/rooms', require('./routes/rooms'));
app.use('/settings', require('./routes/settings'));
app.use('/recall', require('./routes/recall'));
app.use('/audit-logs', require('./routes/audit'));
app.use('/users', require('./routes/users'));
app.use('/backups', require('./routes/backups'));
app.use('/tickets', require('./routes/tickets'));
app.use('/knowledge-base', require('./routes/knowledgeBase'));
app.use('/feedback', require('./routes/feedback'));
app.use('/insurance', require('./routes/insurance'));
app.use('/financial', require('./routes/financial'));

// ✅ Allow BOTH localhost and the network IP
app.use(
  cors({
    origin: [
      'http://localhost:5173', 
      'http://192.168.1.4:5173',
      'http://127.0.0.1:5173'
    ],
    credentials: true,
  })
);

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
  });
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

// ── Start ────────────────────────────────────────────────────────
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