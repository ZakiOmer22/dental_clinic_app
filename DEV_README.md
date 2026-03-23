# 🦷 Dental Clinic Portal — Developer Guide

> Full-stack dental clinic management system.
> Built for real clinics. Runs free. Ships fast.

**Stack:** PostgreSQL (Neon) · Node.js/Express (Render) · React/Vite (Vercel) · Cloudinary
**Schema:** 27 tables · 5 views · 23 CDT procedure codes pre-seeded
**Cost:** $0/month on free tiers

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Backend — Node.js / Express](#3-backend--nodejs--express)
4. [Frontend — React / Vite](#4-frontend--react--vite)
5. [Authentication & Roles](#5-authentication--roles)
6. [File Storage — Cloudinary](#6-file-storage--cloudinary)
7. [Environment Variables](#7-environment-variables)
8. [Free Stack & Deployment](#8-free-stack--deployment)
9. [Step-by-Step Setup](#9-step-by-step-setup)
10. [Keeping Render Awake (UptimeRobot)](#10-keeping-render-awake-uptimerobot)
11. [Free Tier Limits](#11-free-tier-limits)
12. [Launch Checklist](#12-launch-checklist)
13. [Notes for the Team](#13-notes-for-the-team)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│         Browser  ·  Mobile (PWA)  ·  Tablet (Kiosk)        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                  VERCEL  (Frontend)                         │
│          React 18 + Vite · TailwindCSS · shadcn/ui          │
│          CDN-cached static assets · auto-deploys on push    │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API  (JSON)
┌────────────────────────▼────────────────────────────────────┐
│                  RENDER  (Backend API)                      │
│           Node.js 20 · Express 4 · JWT auth                 │
│           Role guard · Input validation · Audit logging     │
│           Kept awake 24/7 by UptimeRobot (free)             │
└──────────┬──────────────────────────────┬───────────────────┘
           │ pg pool (TLS)                │ HTTPS SDK
┌──────────▼──────────┐        ┌──────────▼───────────────────┐
│   NEON  (Database)  │        │   CLOUDINARY  (File Storage)  │
│   PostgreSQL 16     │        │   X-rays · photos · PDFs      │
│   27 tables         │        │   Signed URLs · auto-compress │
│   5 dashboard views │        │   25 GB free                  │
└─────────────────────┘        └──────────────────────────────┘

                    ┌──────────────────────┐
                    │  UPTIMEROBOT (Free)   │
                    │  Pings /health every  │
                    │  5 min — keeps Render │
                    │  awake 24/7 at $0     │
                    └──────────────────────┘
```

### Request Lifecycle

```
Browser
  └─→ Vercel (React SPA)
        └─→ Render (Express API)
              ├─→ JWT middleware        verify token, attach req.user
              ├─→ Role guard            check req.user.role
              ├─→ Input validation      express-validator
              ├─→ Route handler
              ├─→ Service layer         business logic
              └─→ Neon (PostgreSQL)     pg connection pool
```

---

## 2. Database Schema

### Entity Relationship Overview

```
clinics
  ├── users              (staff: admin, dentist, receptionist, assistant, accountant, nurse)
  ├── rooms              (dental chairs, x-ray rooms, surgery suites)
  ├── procedures         (CDT codes catalog with base prices)
  ├── inventory_items
  │     └── inventory_transactions
  ├── expenses
  ├── notifications
  ├── audit_logs
  └── patients
        ├── allergies
        ├── medical_conditions
        ├── emergency_contacts
        ├── insurance_policies
        ├── dental_chart           (tooth-by-tooth odontogram, ISO/Universal/Palmer)
        ├── recall_schedule
        ├── consent_forms
        ├── referrals
        ├── patient_files          (Cloudinary URLs: X-rays, photos, PDFs)
        ├── appointments
        │     └── treatments
        │           ├── treatment_procedures   (CDT line items)
        │           ├── prescriptions
        │           ├── lab_orders             (crowns, dentures, aligners)
        │           └── patient_files
        └── invoices
              ├── invoice_items
              └── payments
```

### All 27 Tables

| # | Table | Purpose |
|---|-------|---------|
| 1 | `clinics` | Multi-branch support. Every other table scopes to a `clinic_id`. |
| 2 | `users` | Staff accounts. Roles: `admin`, `dentist`, `receptionist`, `assistant`, `accountant`, `nurse` |
| 3 | `patients` | Core patient record. Auto-generates `PT-00001` patient numbers via trigger. |
| 4 | `allergies` | Per-patient allergens with severity: `mild`, `moderate`, `severe` |
| 5 | `medical_conditions` | Systemic conditions with ICD-10 codes (Diabetes, Hypertension, etc.) |
| 6 | `emergency_contacts` | Next-of-kin contacts, supports primary flag |
| 7 | `insurance_policies` | Coverage %, annual limit, used amount tracked per patient |
| 8 | `rooms` | Dental chairs, X-ray rooms, surgery suites, sterilization |
| 9 | `procedures` | Services catalog with CDT codes and base prices (23 seeded) |
| 10 | `appointments` | Calendar bookings. 8 types × 7 statuses. |
| 11 | `dental_chart` | Per-tooth conditions — ISO 3950, Universal (1–32), or Palmer notation |
| 12 | `treatments` | SOAP clinical notes per visit |
| 13 | `treatment_procedures` | CDT line items linking procedures to a treatment |
| 14 | `prescriptions` | Medications with dosage, frequency, dispensing status |
| 15 | `lab_orders` | Crown/denture/aligner orders sent to external labs with shade codes |
| 16 | `invoices` | Bills with percent or fixed discounts + insurance deduction. Auto-numbers `INV-00001`. |
| 17 | `invoice_items` | Line items per invoice |
| 18 | `payments` | 7 methods: `cash`, `card`, `mobile_money`, `bank_transfer`, `insurance`, `cheque`, `other` |
| 19 | `inventory_items` | Stock catalog with min/max levels and reorder quantities |
| 20 | `inventory_transactions` | Every stock movement: received, used, wasted, returned, expired |
| 21 | `patient_files` | Cloudinary URLs for X-rays, photos, consent PDFs, lab results |
| 22 | `referrals` | Specialist referrals with urgency (`routine`, `urgent`, `emergency`) and outcome |
| 23 | `consent_forms` | Signed consent records (general, surgical, anaesthesia, photography) |
| 24 | `notifications` | Channels: `sms`, `email`, `whatsapp`, `in_app`, `push` |
| 25 | `audit_logs` | Every INSERT/UPDATE/DELETE/LOGIN logged with `old_values` and `new_values` as JSONB |
| 26 | `recall_schedule` | 6-month cleaning reminders, auto-tracked per patient |
| 27 | `expenses` | Clinic operating costs: Rent, Utilities, Salaries, Supplies, Equipment |

### Pre-built Dashboard Views

| View | Returns |
|------|---------|
| `vw_daily_appointments` | All appointments joined with patient + doctor names + room name |
| `vw_todays_schedule` | Today's appointments ordered by time — for the dashboard widget |
| `vw_patient_balance` | Total billed / paid / outstanding balance per patient |
| `vw_revenue_summary` | Revenue grouped by month and payment method |
| `vw_low_stock` | Inventory items at or below their minimum stock level |

Use these views in your route handlers instead of writing raw JOINs.

### Pre-seeded Data

**Default clinic:** Smile Dental Clinic — Hargeisa, Somaliland
**Default admin:** `admin@smileclinic.so` / `Admin@1234`
⚠️ The password hash in the seed is a placeholder. Replace with a real bcrypt hash before deploying.

**23 CDT procedure codes pre-seeded** (D0150 through D9999) with realistic prices.

### Key Design Decisions

- **Multi-clinic from day one** — `clinic_id` on every table. Scales to a chain without schema changes.
- **Auto-numbering via triggers** — `PT-00001` for patients, `INV-00001` for invoices.
- **Dental chart is surface-level** — MDOBL (Mesial, Distal, Occlusal, Buccal, Lingual) per tooth. Supports ISO, Universal, and Palmer notation.
- **Audit trail is JSONB diffs** — `old_values` and `new_values` store full before/after state.
- **Financial model is explicit** — `discount_type` is `percent`, `fixed`, or `none`.
- **Notifications are async** — write to `notifications` table first, dispatch in a background job.

---

## 3. Backend — Node.js / Express

### Project Structure

```
src/
├── server.js
├── db/
│   └── pool.js                   ← Neon pg connection pool (TLS, max 10)
├── middleware/
│   ├── auth.js                   ← JWT verify → attaches req.user
│   ├── roles.js                  ← requireRole('admin','dentist') guard
│   ├── validate.js               ← express-validator error formatter
│   └── auditLog.js               ← writes actions to audit_logs
├── routes/
│   ├── auth.js
│   ├── patients.js
│   ├── appointments.js
│   ├── treatments.js
│   ├── billing.js
│   ├── inventory.js
│   ├── files.js
│   ├── reports.js
│   └── notifications.js
└── services/
    ├── patientService.js
    ├── invoiceService.js
    ├── notificationService.js
    └── cloudinaryService.js
```

### Install

```bash
npm install express pg bcryptjs jsonwebtoken cors dotenv helmet morgan
npm install express-validator
npm install multer cloudinary
npm install nodemailer
npm install node-cron
```

### `db/pool.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },   // required for Neon
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

module.exports = pool;
```

### `server.js`

```javascript
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(morgan('combined'));

app.use('/auth',          require('./routes/auth'));
app.use('/patients',      require('./routes/patients'));
app.use('/appointments',  require('./routes/appointments'));
app.use('/treatments',    require('./routes/treatments'));
app.use('/billing',       require('./routes/billing'));
app.use('/inventory',     require('./routes/inventory'));
app.use('/reports',       require('./routes/reports'));
app.use('/files',         require('./routes/files'));
app.use('/notifications', require('./routes/notifications'));

// ⚡ IMPORTANT: UptimeRobot pings this every 5 min to keep Render awake
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DentiFlow API running on :${PORT}`));
```

### Key API Endpoints

```
# Auth
POST   /auth/login
POST   /auth/register
POST   /auth/refresh
POST   /auth/logout

# Patients
GET    /patients                  ?search=&page=&limit=
POST   /patients
GET    /patients/:id
PUT    /patients/:id
DELETE /patients/:id
GET    /patients/:id/chart
GET    /patients/:id/history
GET    /patients/:id/balance      (vw_patient_balance)
GET    /patients/:id/files

# Appointments
GET    /appointments              ?date=&doctor=&status=
POST   /appointments
PUT    /appointments/:id
PATCH  /appointments/:id/status
GET    /appointments/today        (vw_todays_schedule)

# Treatments
POST   /treatments
GET    /treatments/:id
PUT    /treatments/:id
POST   /treatments/:id/procedures
POST   /treatments/:id/prescriptions
POST   /treatments/:id/lab-orders

# Billing
GET    /billing/invoices          ?status=&patient=
POST   /billing/invoices
GET    /billing/invoices/:id
POST   /billing/invoices/:id/payment
GET    /billing/patient/:id/balance

# Inventory
GET    /inventory                 ?category=&lowstock=true
POST   /inventory
PUT    /inventory/:id
POST   /inventory/transaction
GET    /inventory/alerts          (vw_low_stock)

# Reports
GET    /reports/revenue           (vw_revenue_summary)
GET    /reports/schedule          (vw_daily_appointments)
GET    /reports/recalls
GET    /reports/expenses

# Files
POST   /files/upload
GET    /files/patient/:id
DELETE /files/:id

# Health (pinged by UptimeRobot)
GET    /health
```

---

## 4. Frontend — React / Vite

### Tech Stack

| Package | Purpose |
|---------|---------|
| React 18 + Vite | Framework + fast bundler |
| React Router v6 | Client-side routing |
| TailwindCSS | Utility-first styling |
| shadcn/ui | Accessible component library |
| TanStack Query v5 | Server state, caching, refetch |
| TanStack Table v8 | Sortable, filterable, paginated tables |
| React Hook Form + Zod | Form state + validation |
| FullCalendar | Appointment calendar view |
| Recharts | Revenue charts |
| Axios | HTTP client with JWT interceptor |
| Zustand | Auth token + user global state |
| date-fns | Date formatting |

### Project Structure

```
src/
├── main.jsx
├── App.jsx
├── api/
│   ├── client.js                 ← Axios + JWT interceptor + auto-logout on 401
│   ├── auth.js
│   ├── patients.js
│   ├── appointments.js
│   ├── billing.js
│   └── reports.js
├── hooks/
│   ├── useAuth.js
│   ├── usePatients.js
│   ├── useAppointments.js
│   └── useBilling.js
├── store/
│   └── authStore.js              ← Zustand: token, user, clinicId
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Patients/
│   │   ├── PatientList.jsx
│   │   ├── PatientDetail.jsx     ← Tabs: Overview · Chart · History · Files · Billing
│   │   └── PatientForm.jsx
│   ├── Appointments/
│   │   ├── Calendar.jsx          ← FullCalendar week/day + drag-to-reschedule
│   │   └── AppointmentForm.jsx
│   ├── Treatments/
│   │   ├── TreatmentForm.jsx
│   │   └── DentalChart.jsx       ← Interactive SVG odontogram
│   ├── Billing/
│   │   ├── InvoiceList.jsx
│   │   ├── InvoiceDetail.jsx
│   │   └── PaymentModal.jsx
│   ├── Inventory/
│   │   └── StockList.jsx
│   └── Reports/
│       ├── Revenue.jsx
│       └── DailySchedule.jsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx           ← Role-aware nav
│   │   ├── Topbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── dental/
│   │   ├── Odontogram.jsx        ← SVG 32-tooth chart
│   │   └── ToothModal.jsx
│   └── ui/                       ← shadcn/ui components
└── utils/
    ├── formatCurrency.js
    ├── formatDate.js
    └── roleGuard.js
```

### `api/client.js`

```javascript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

client.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
```

---

## 5. Authentication & Roles

### JWT Flow

```
1. POST /auth/login  { email, password }
        ↓
   bcrypt.compare(password, hash)          12 rounds minimum
        ↓
   Sign JWT  { userId, clinicId, role }    expires 7d
        ↓
   Response: { token, user }
        ↓
2. Client stores token in Zustand + localStorage
3. Axios interceptor attaches Bearer on every request
4. auth.js middleware verifies + decodes on every protected route
5. roles.js guard checks req.user.role before handler runs
6. auditLog.js writes action to audit_logs after response
```

### Role Permission Matrix

| Feature | `admin` | `dentist` | `receptionist` | `accountant` | `assistant` |
|---------|---------|-----------|----------------|--------------|-------------|
| Patients — full CRUD | ✅ | ✅ | ✅ | 👁 view | 👁 view |
| Appointments — all | ✅ | own only | ✅ | 👁 view | 👁 view |
| Treatments & clinical notes | ✅ | own only | 👁 view | ❌ | 👁 view |
| Billing & payments | ✅ | 👁 view | ✅ | ✅ | ❌ |
| Inventory management | ✅ | 👁 view | 👁 view | 👁 view | ✅ |
| Reports | ✅ | own stats | 👁 basic | ✅ | ❌ |
| User management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 6. File Storage — Cloudinary

```
Browser
  └─→ POST /files/upload  (multipart/form-data)
        └─→ multer (memoryStorage)
              └─→ Cloudinary SDK
                    └─→ URL saved in patient_files table
```

### Cloudinary folder structure

```
dentiflow/
  clinic-1/
    patient-42/
      xray-2024-01-15.jpg
      consent-form-signed.pdf
      photo-before.jpg
```

### Upload route (`routes/files.js`)

```javascript
const cloudinary = require('cloudinary').v2;
const multer     = require('multer');
const pool       = require('../db/pool');
const auth       = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  const b64     = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: `dentiflow/clinic-${req.user.clinicId}/patient-${req.body.patientId}`,
    resource_type: 'auto',
  });

  await pool.query(
    `INSERT INTO patient_files
       (patient_id, uploaded_by, file_name, file_url, file_type, file_size_kb, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      req.body.patientId, req.user.id,
      req.file.originalname, result.secure_url,
      req.file.mimetype, Math.round(req.file.size / 1024),
      req.body.category,
    ]
  );

  res.json({ url: result.secure_url, publicId: result.public_id });
});
```

---

## 7. Environment Variables

### Render — API Server

```env
# Database — from Neon dashboard, use the POOLED connection string
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Auth — generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=replace_with_64_char_random_string_never_commit_this
JWT_EXPIRES_IN=7d

# Cloudinary — from cloudinary.com dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.vercel.app
```

### Vercel — Frontend

```env
VITE_API_URL=https://your-api.onrender.com
```

---

## 8. Free Stack & Deployment

| Layer | Service | Why | Free Limit |
|-------|---------|-----|------------|
| Database | **Neon** | Pure PostgreSQL. 10 branches. No lock-in. | 0.5 GB |
| Backend API | **Render** | No credit card. GitHub CI/CD. Free tier kept awake by UptimeRobot. | 750 hrs/month |
| Frontend | **Vercel** | React/Vite. Auto-deploys on push. Global CDN. | 100 GB bandwidth |
| Files | **Cloudinary** | Signed uploads. Auto-compress. PDF + image support. | 25 GB |
| Keep-alive | **UptimeRobot** | Pings `/health` every 5 min. Keeps Render awake 24/7 for free. | 50 monitors free |
| Auth | **JWT + bcrypt** | Built into Express. No third-party needed. | Free forever |

### Why Render instead of Railway?

Railway now requires a paid subscription. Render's free tier is genuinely free — no credit card, no expiry. The only catch is a 15-minute sleep on inactivity, which UptimeRobot (Section 10) eliminates completely at zero cost.

### Why Neon for the database?

- Pure PostgreSQL — no wrappers, no proprietary syntax
- 10 free database branches — create a `dev` branch, test migrations, merge to `main`
- Works with Prisma, Drizzle, Knex, or raw `pg`
- The DentiFlow schema runs with zero modifications
- Stays online 24/7 — no sleep, no cold starts on the database side

---

## 9. Step-by-Step Setup

### Step 1 — Neon Database (3 minutes)

```
1. Sign up:  https://neon.tech  (GitHub or Google login, no card)
2. New Project → name it "dentiflow"
3. Choose region closest to you (eu-west-1 for East Africa)
4. Copy the POOLED connection string from the dashboard
5. Open SQL Editor → paste and run schema.sql
6. Verify:
```

```sql
-- Should return 27
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- Should return 23
SELECT COUNT(*) FROM procedures;

-- Should return 5
SELECT COUNT(*) FROM pg_views WHERE viewname LIKE 'vw_%';
```

### Step 2 — Render API (5 minutes)

```
1. Sign up:  https://render.com  (GitHub login, no card needed)
2. New → Web Service → Connect your GitHub API repo
3. Settings:
     Name:         dentiflow-api
     Region:       Frankfurt (closest to East Africa)
     Branch:       main
     Runtime:      Node
     Build Command: npm install
     Start Command: node src/server.js
     Plan:         Free
4. Environment → Add all vars from Section 7
5. Click "Create Web Service"
6. Wait ~2 min for first deploy
7. Test:
```

```bash
curl https://dentiflow-api.onrender.com/health
# → { "ok": true, "ts": 1234567890 }
```

### Step 3 — Vercel Frontend (3 minutes)

```
1. Sign up:  https://vercel.com  (GitHub login)
2. New Project → Import your frontend repo
3. Framework Preset: Vite
4. Environment Variables:
     VITE_API_URL = https://dentiflow-api.onrender.com
5. Deploy
6. Every push to main auto-deploys
```

### Step 4 — Cloudinary Files (2 minutes)

```
1. Sign up:  https://cloudinary.com  (free, no card)
2. Dashboard → copy Cloud Name, API Key, API Secret
3. Add all three to Render environment variables
4. Render auto-redeploys on env var changes
```

### Step 5 — UptimeRobot Keep-Alive (2 minutes)

See Section 10 for the full setup. This is critical — do it right after Step 2.

### Step 6 — End-to-End Test

```bash
# 1. Login
curl -X POST https://dentiflow-api.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smileclinic.so","password":"Admin@1234"}'
# → { "token": "eyJ...", "user": { "id": 1, "role": "admin" } }

TOKEN="eyJ..."

# 2. Get procedures (should have 23)
curl https://dentiflow-api.onrender.com/procedures \
  -H "Authorization: Bearer $TOKEN"
# → { "data": [ ...23 CDT codes... ] }

# 3. Create a patient
curl -X POST https://dentiflow-api.onrender.com/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ahmed Hassan","phone":"+252612345678","gender":"Male"}'
# → { "id": 1, "patientNumber": "PT-00001", ... }
```

---

## 10. Keeping Render Awake (UptimeRobot)

Render's free tier sleeps after 15 minutes of inactivity. The fix is a free ping service.

### Setup (2 minutes)

```
1. Sign up: https://uptimerobot.com  (free, no card)
2. Dashboard → Add New Monitor
3. Settings:
     Monitor Type:  HTTP(s)
     Friendly Name: DentiFlow API
     URL:           https://dentiflow-api.onrender.com/health
     Monitoring Interval: Every 5 minutes
4. Click "Create Monitor"
```

That's it. UptimeRobot pings your `/health` endpoint every 5 minutes. Render sees activity and never sleeps. You also get a free uptime dashboard and email alerts if your API ever goes down.

### The `/health` endpoint (already in server.js)

```javascript
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
```

This endpoint requires no auth, adds zero load to your database, and responds in under 1ms. It's the only thing UptimeRobot needs.

### Verify it's working

After 30 minutes, check the UptimeRobot dashboard. It should show 100% uptime with a green status. If Render was sleeping before you set this up, the first ping after the sleep will take ~30 seconds to respond — that's normal. Every ping after that is instant.

---

## 11. Free Tier Limits

| Service | Limit | Handles |
|---------|-------|---------|
| Neon | 0.5 GB storage | ~500,000 full patient records |
| Render | 750 hrs/month free | Fully covered with UptimeRobot keeping it alive |
| Vercel | 100 GB bandwidth/month | Thousands of concurrent sessions |
| Cloudinary | 25 GB storage | Thousands of X-rays and scanned consent PDFs |
| UptimeRobot | 50 monitors, 5-min interval | More than enough for DentiFlow |

All services scale to paid tiers when you need it. Same APIs, same code — no migration required.

---

## 12. Launch Checklist

- [ ] Neon: create project → run `schema.sql`
- [ ] Neon: verify `SELECT COUNT(*) FROM procedures` returns **23**
- [ ] Neon: verify `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'` returns **27**
- [ ] Neon: replace placeholder admin password hash with real bcrypt hash
- [ ] Render: create web service → push API → confirm `GET /health` returns `{ ok: true }`
- [ ] Render: set all environment variables (DATABASE_URL, JWT_SECRET, CLOUDINARY_*, FRONTEND_URL)
- [ ] Render: confirm `NODE_ENV=production`
- [ ] UptimeRobot: add monitor for `https://your-api.onrender.com/health` at 5-min interval
- [ ] UptimeRobot: wait 15 min, confirm green status in dashboard
- [ ] Vercel: deploy frontend → confirm login page loads
- [ ] Vercel: set `VITE_API_URL` to your Render URL
- [ ] Cloudinary: add Cloud Name, API Key, Secret to Render env vars
- [ ] Full test: login → create patient → book appointment → record treatment → generate invoice → payment
- [ ] Confirm `audit_logs` rows written after mutations
- [ ] Confirm `vw_todays_schedule` returns data after booking a test appointment for today

---

## 13. Notes for the Team

**Schema changes** — use Neon branches. Create a `dev` branch, run `ALTER TABLE` migrations there, test, then apply to `main`. Never run migrations directly on production.

**Passwords** — `bcryptjs` with 12 rounds minimum. The seed hash in `schema.sql` is a placeholder and will fail `bcrypt.compare` until replaced with a real hash.

**Generate a real hash:**
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('YourNewPassword123!', 12).then(console.log);
// Copy the output into the UPDATE statement below and run in Neon SQL Editor:
// UPDATE users SET password_hash = '$2b$12$...' WHERE email = 'admin@smileclinic.so';
```

**Indexes** — every FK and common filter column is indexed. Run `EXPLAIN ANALYZE` before adding new indexes.

**Views** — use the 5 dashboard views in route handlers instead of rewriting JOINs.

**Cloudinary folders** — keep the `dentiflow/clinic-{id}/patient-{id}/` pattern for easy bulk operations.

**Notifications** — write to the `notifications` table synchronously, dispatch (email/SMS) asynchronously via `node-cron`. Never await an SMS send inside a request handler.

**Audit logs** — `auditLog.js` fires after `res.on('finish', ...)`. It never blocks a request.

**Multi-clinic** — add `WHERE clinic_id = req.user.clinicId` to every query. Without this, users will see other clinics' data.

**Render cold starts** — with UptimeRobot running, cold starts should never happen in practice. If Render goes down and restarts, the first request after restart may take 10–15 seconds. This is normal and happens at most once per deployment.
