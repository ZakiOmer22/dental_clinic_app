# 🦷 DentiFlow — Developer Guide

> Full-stack dental clinic management system.
> Built for real clinics. Runs free. Ships fast.

**Stack:** PostgreSQL (Neon) · Node.js/Express (Railway) · React/Vite (Vercel) · Cloudinary  
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
10. [Free Tier Limits](#10-free-tier-limits)
11. [Launch Checklist](#11-launch-checklist)
12. [Notes for the Team](#12-notes-for-the-team)

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
│                 RAILWAY  (Backend API)                      │
│           Node.js 20 · Express 4 · JWT auth                 │
│           Role guard · Input validation · Audit logging     │
└──────────┬──────────────────────────────┬───────────────────┘
           │ pg pool (TLS)                │ HTTPS SDK
┌──────────▼──────────┐        ┌──────────▼───────────────────┐
│   NEON  (Database)  │        │   CLOUDINARY  (File Storage)  │
│   PostgreSQL 16     │        │   X-rays · photos · PDFs      │
│   27 tables         │        │   Signed URLs · auto-compress │
│   5 dashboard views │        │   25 GB free                  │
└─────────────────────┘        └──────────────────────────────┘
```

### Request Lifecycle

```
Browser
  └─→ Vercel (React SPA)
        └─→ Railway (Express API)
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

Use these views in your route handlers instead of writing raw JOINs. They are indexed and maintained.

### Pre-seeded Data

**Default clinic:** Smile Dental Clinic — Hargeisa, Somaliland

**Default admin:** `admin@smileclinic.so` / `Admin@1234`  
⚠️ The password hash in the seed is a placeholder. Replace with a real bcrypt hash before use.

**23 CDT procedure codes seeded with realistic prices:**

| CDT Code | Procedure | Price |
|----------|-----------|-------|
| D0150 | Comprehensive Oral Exam | $30 |
| D0220 | Periapical X-Ray | $15 |
| D0330 | Panoramic X-Ray | $60 |
| D1110 | Prophylaxis (Adult) | $70 |
| D2140 | Composite Filling (1 surf) | $80 |
| D2740 | Crown (Porcelain) | $500 |
| D3310 | Root Canal (Anterior) | $400 |
| D3330 | Root Canal (Molar) | $600 |
| D7110 | Simple Extraction | $80 |
| D7210 | Surgical Extraction | $150 |
| D5110 | Complete Denture | $900 |
| D6010 | Dental Implant | $1,500 |
| D9975 | Teeth Whitening (Office) | $200 |
| D4341 | Scaling & Root Planing | $150 |
| D9999 | Emergency Exam & TX | $50 |
| … | + 8 more | … |

### Key Design Decisions

- **Multi-clinic from day one** — `clinic_id` on every table. Scales to a chain without schema changes.
- **Auto-numbering via triggers** — `PT-00001` for patients, `INV-00001` for invoices. Never gaps, never duplicates.
- **Dental chart is surface-level** — MDOBL (Mesial, Distal, Occlusal, Buccal, Lingual) per tooth. Supports ISO, Universal, and Palmer notation.
- **Audit trail is JSONB diffs** — `audit_logs.old_values` and `new_values` store the full before/after state.
- **Financial model is explicit** — `discount_type` is `percent`, `fixed`, or `none`. No ambiguity.
- **Notifications are async** — write to the `notifications` table first, dispatch in a background job. Never block a request on SMS.

---

## 3. Backend — Node.js / Express

### Project Structure

```
src/
├── server.js                     ← Express app: middleware, routes, error handler
│
├── db/
│   └── pool.js                   ← Neon pg connection pool (TLS, max 10 connections)
│
├── middleware/
│   ├── auth.js                   ← JWT verify → attaches req.user { id, clinicId, role }
│   ├── roles.js                  ← requireRole('admin', 'dentist') guard
│   ├── validate.js               ← express-validator error formatter
│   └── auditLog.js               ← writes INSERT/UPDATE/DELETE to audit_logs
│
├── routes/
│   ├── auth.js                   ← POST /auth/login, /register, /refresh, /logout
│   ├── patients.js               ← CRUD + search + dental chart + history
│   ├── appointments.js           ← calendar, reschedule, status updates, today's list
│   ├── treatments.js             ← SOAP notes, CDT procedures, prescriptions, lab orders
│   ├── billing.js                ← invoices, payments, insurance claims, patient balance
│   ├── inventory.js              ← stock levels, transactions, low-stock alerts
│   ├── files.js                  ← Cloudinary upload + signed URL generation
│   ├── reports.js                ← revenue, schedule, recall due, expense summary
│   └── notifications.js          ← send and read notifications
│
└── services/
    ├── patientService.js         ← patient business logic
    ├── invoiceService.js         ← total calculation: subtotal, tax, discount, insurance
    ├── notificationService.js    ← nodemailer email + SMS dispatch
    └── cloudinaryService.js      ← upload, delete, signed URL helpers
```

### Install

```bash
# Core
npm install express pg bcryptjs jsonwebtoken cors dotenv helmet morgan

# Validation
npm install express-validator

# File uploads
npm install multer cloudinary

# Email reminders
npm install nodemailer

# Recall / reminder scheduler
npm install node-cron
```

### Key API Endpoints

```
# Auth
POST   /auth/login
POST   /auth/register
POST   /auth/refresh
POST   /auth/logout

# Patients
GET    /patients                      ?search=&page=&limit=&doctor=
POST   /patients
GET    /patients/:id
PUT    /patients/:id
DELETE /patients/:id
GET    /patients/:id/chart            full dental chart (all teeth)
GET    /patients/:id/history          full visit + treatment history
GET    /patients/:id/balance          invoices + payments summary (vw_patient_balance)
GET    /patients/:id/files            all Cloudinary files

# Appointments
GET    /appointments                  ?date=&doctor=&status=&clinic=
POST   /appointments
PUT    /appointments/:id
PATCH  /appointments/:id/status       confirm, cancel, complete, no-show
GET    /appointments/today            uses vw_todays_schedule

# Treatments
POST   /treatments
GET    /treatments/:id
PUT    /treatments/:id
POST   /treatments/:id/procedures     add CDT line items
POST   /treatments/:id/prescriptions
POST   /treatments/:id/lab-orders

# Billing
GET    /billing/invoices              ?status=&patient=
POST   /billing/invoices
GET    /billing/invoices/:id
POST   /billing/invoices/:id/payment
GET    /billing/patient/:id/balance   uses vw_patient_balance

# Inventory
GET    /inventory                     ?category=&lowstock=true
POST   /inventory
PUT    /inventory/:id
POST   /inventory/transaction         receive / use / waste / expire
GET    /inventory/alerts              uses vw_low_stock

# Reports
GET    /reports/revenue               uses vw_revenue_summary
GET    /reports/schedule              uses vw_daily_appointments
GET    /reports/recalls               patients overdue for recall
GET    /reports/expenses

# Files
POST   /files/upload                  multipart/form-data → Cloudinary
GET    /files/patient/:id
DELETE /files/:id

# Health
GET    /health
```

### `db/pool.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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

app.use('/auth',           require('./routes/auth'));
app.use('/patients',       require('./routes/patients'));
app.use('/appointments',   require('./routes/appointments'));
app.use('/treatments',     require('./routes/treatments'));
app.use('/billing',        require('./routes/billing'));
app.use('/inventory',      require('./routes/inventory'));
app.use('/reports',        require('./routes/reports'));
app.use('/files',          require('./routes/files'));
app.use('/notifications',  require('./routes/notifications'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DentiFlow API running on :${PORT}`));
```

---

## 4. Frontend — React / Vite

### Tech Stack

| Package | Purpose |
|---------|---------|
| React 18 + Vite | Framework + fast bundler |
| React Router v6 | Client-side routing with layout routes |
| TailwindCSS | Utility-first styling |
| shadcn/ui | Accessible component library (Radix UI based) |
| TanStack Query v5 | Server state, caching, background refetch |
| TanStack Table v8 | Sortable, filterable, paginated data tables |
| React Hook Form + Zod | Form state + schema validation |
| FullCalendar | Week/day appointment calendar view |
| Recharts | Revenue + analytics charts |
| Axios | HTTP client with JWT interceptor + 401 auto-logout |
| Zustand | Lightweight global state (auth token + user) |
| date-fns | Date formatting and manipulation |

### Install

```bash
npm create vite@latest dentiflow-web -- --template react
cd dentiflow-web

npm install react-router-dom
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form zod @hookform/resolvers
npm install axios date-fns recharts zustand
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install tailwindcss postcss autoprefixer && npx tailwindcss init -p
npx shadcn-ui@latest init
```

### Project Structure

```
src/
├── main.jsx                      ← React entry point, QueryClientProvider, Router
├── App.jsx                       ← Route tree + ProtectedRoute wrapper
│
├── api/
│   ├── client.js                 ← Axios instance + JWT interceptor + 401 handler
│   ├── auth.js
│   ├── patients.js
│   ├── appointments.js
│   ├── billing.js
│   ├── inventory.js
│   └── reports.js
│
├── hooks/
│   ├── useAuth.js                ← JWT decode, role checks, logout helper
│   ├── usePatients.js            ← TanStack Query: usePatients, usePatient, useMutatePatient
│   ├── useAppointments.js
│   └── useBilling.js
│
├── store/
│   └── authStore.js              ← Zustand: token, user object, clinicId, setAuth, clear
│
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx             ← Today's schedule, KPI cards, low-stock banner, upcoming recalls
│   │
│   ├── Patients/
│   │   ├── PatientList.jsx       ← Searchable + filterable table (TanStack Table)
│   │   ├── PatientDetail.jsx     ← Tabs: Overview · Chart · History · Files · Billing
│   │   └── PatientForm.jsx       ← Create / edit (React Hook Form + Zod)
│   │
│   ├── Appointments/
│   │   ├── Calendar.jsx          ← FullCalendar week/day. Drag to reschedule. Color by status.
│   │   └── AppointmentForm.jsx
│   │
│   ├── Treatments/
│   │   ├── TreatmentForm.jsx     ← SOAP notes + CDT procedure picker + prescription + lab order
│   │   └── DentalChart.jsx       ← Interactive SVG odontogram (32-tooth, click to annotate)
│   │
│   ├── Billing/
│   │   ├── InvoiceList.jsx
│   │   ├── InvoiceDetail.jsx     ← Line items, discount toggle, insurance deduction, print PDF
│   │   └── PaymentModal.jsx      ← 7 payment methods, partial support, cash change calculator
│   │
│   ├── Inventory/
│   │   ├── StockList.jsx         ← Table + inline quantity edit
│   │   └── LowStockAlert.jsx     ← Badge + alert banner
│   │
│   └── Reports/
│       ├── Revenue.jsx           ← Recharts line/bar, filter by month and payment method
│       ├── DailySchedule.jsx
│       └── DoctorPerformance.jsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx           ← Role-aware nav (hides pages the user can't access)
│   │   ├── Topbar.jsx
│   │   └── ProtectedRoute.jsx    ← Redirects to /login if no valid token
│   │
│   ├── dental/
│   │   ├── Odontogram.jsx        ← SVG 32-tooth chart, click any tooth to open ToothModal
│   │   └── ToothModal.jsx        ← Log condition, surface (MDOBL), severity, notes
│   │
│   └── ui/                       ← shadcn/ui: Button, Dialog, Table, Badge, Select, etc.
│
└── utils/
    ├── formatCurrency.js
    ├── formatDate.js
    └── roleGuard.js              ← canAccess(role, resource) helper
```

### `api/client.js`

```javascript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Attach JWT to every request
client.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
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

### Pages & Key Features

| Page | Key Features |
|------|-------------|
| **Dashboard** | Today's schedule, KPI cards (patients today / revenue today / low stock), upcoming recalls |
| **Patient List** | Search by name / phone / patient number. Filter by doctor. Paginated with TanStack Table. |
| **Patient Detail** | 5 tabs: Overview (demographics, allergies, conditions) · Dental Chart (SVG) · Visit History · Files (X-rays) · Billing |
| **Dental Chart** | Interactive SVG odontogram. Click any tooth to log condition, surface (MDOBL), severity, notes. |
| **Calendar** | FullCalendar week/day view. Drag to reschedule. Color-coded by appointment status. |
| **Treatment Form** | SOAP notes + searchable CDT procedure picker + prescription writer + lab order form |
| **Invoice** | Auto-populates line items from treatment procedures. Discount toggle (% or fixed amount). Insurance deduction. Print-ready PDF. |
| **Payment Modal** | 7 payment methods. Partial payment support. Change calculator for cash payments. |
| **Inventory** | Stock table with inline quantity edit. Low-stock banner. Full transaction log. |
| **Reports** | Revenue by month (Recharts). Appointment stats. Expense summary. Doctor performance. |

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
3. Axios interceptor attaches as Bearer on every request
4. Express auth.js middleware verifies + decodes on every protected route
5. roles.js guard checks req.user.role before the handler runs
6. auditLog.js middleware writes the action to audit_logs after response
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

All patient files (X-rays, photos, consent forms, lab results) go to Cloudinary. The API handles the upload and writes the Cloudinary URL to `patient_files.file_url`.

```
Browser
  └─→ POST /files/upload  (multipart/form-data)
        └─→ multer (memoryStorage — no disk writes)
              └─→ Cloudinary SDK  (upload stream)
                    └─→ URL saved in patient_files table
```

### Folder structure in Cloudinary

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
    resource_type: 'auto',          // handles JPEG, PNG, PDF, DICOM
  });

  await pool.query(
    `INSERT INTO patient_files
       (patient_id, uploaded_by, file_name, file_url, file_type, file_size_kb, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      req.body.patientId,
      req.user.id,
      req.file.originalname,
      result.secure_url,
      req.file.mimetype,
      Math.round(req.file.size / 1024),
      req.body.category,            // xray, photo, document, consent_form, etc.
    ]
  );

  res.json({ url: result.secure_url, publicId: result.public_id });
});
```

---

## 7. Environment Variables

### Railway — API Server

```env
# Database (from Neon dashboard — use the Pooled connection string)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Auth (generate with: node -e "require('crypto').randomBytes(64).toString('hex')|head -c 64")
JWT_SECRET=replace_with_64_char_random_string_never_commit_this
JWT_EXPIRES_IN=7d

# Cloudinary (from cloudinary.com dashboard)
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
VITE_API_URL=https://your-api.up.railway.app
```

---

## 8. Free Stack & Deployment

| Layer | Service | Why | Free Limit |
|-------|---------|-----|------------|
| Database | **Neon** | Pure PostgreSQL. 10 branches. No lock-in. Works with any ORM. | 0.5 GB |
| Backend API | **Railway** | Node.js/Express. GitHub CI/CD. Public URL instantly. | $5 credit/month |
| Frontend | **Vercel** | React/Vite. Auto-deploys on push. Global edge CDN. | 100 GB bandwidth |
| Files | **Cloudinary** | Signed uploads. Auto-compress. Supports PDF + DICOM. | 25 GB storage |
| Auth | **JWT + bcrypt** | Built into Express. No third-party service. | Free forever |

### Why Neon, not Supabase DB?

- Pure PostgreSQL — no wrappers, no proprietary syntax
- 10 free database branches — create a `dev` branch, test migrations, merge to `main`
- Serverless-compatible HTTP API — no connection pool issues in edge functions
- Works with Prisma, Drizzle, Knex, or raw `pg` — your choice
- The DentiFlow schema runs on Neon with zero modifications

---

## 9. Step-by-Step Setup

### Step 1 — Neon (3 minutes)

```bash
# 1. Sign up: https://neon.tech
# 2. Create project: "dentiflow"
# 3. Copy the POOLED connection string (not the direct URL — pooled handles serverless)
# 4. Open SQL Editor in Neon dashboard
# 5. Paste and run schema.sql
# 6. Verify:
#    SELECT COUNT(*) FROM procedures;     → 23
#    SELECT COUNT(*) FROM pg_views WHERE viewname LIKE 'vw_%';  → 5
```

### Step 2 — Railway (5 minutes)

```bash
# 1. Sign up: https://railway.app
# 2. New Project → Deploy from GitHub → select your API repo
# 3. Add all environment variables from section 7
# 4. Railway detects Node.js and runs: npm start
# 5. Copy your public URL (shown in the Railway dashboard)

# Test immediately:
curl https://your-api.up.railway.app/health
# → { "ok": true }
```

### Step 3 — Vercel (3 minutes)

```bash
# 1. Sign up: https://vercel.com
# 2. Import your frontend GitHub repo
# 3. Set environment variable: VITE_API_URL = your Railway API URL
# 4. Deploy — gets URL: https://dentiflow.vercel.app
# 5. Every push to main auto-deploys
```

### Step 4 — Cloudinary (2 minutes)

```bash
# 1. Sign up: https://cloudinary.com
# 2. Dashboard → copy Cloud Name, API Key, API Secret
# 3. Add all three to Railway environment variables
# 4. Redeploy Railway (or it auto-detects env changes)
```

### Step 5 — End-to-End Test

```bash
# Login
curl -X POST https://your-api.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smileclinic.so","password":"Admin@1234"}'
# → { "token": "eyJ...", "user": { "id": 1, "role": "admin" } }

# Use the token
TOKEN="eyJ..."

# Get patients (empty at first)
curl https://your-api.up.railway.app/patients \
  -H "Authorization: Bearer $TOKEN"
# → { "data": [], "total": 0 }

# Get procedures (should have 23)
curl https://your-api.up.railway.app/procedures \
  -H "Authorization: Bearer $TOKEN"
# → { "data": [ ... 23 CDT codes ... ] }
```

---

## 10. Free Tier Limits

| Service | Limit | Handles |
|---------|-------|---------|
| Neon | 0.5 GB storage | ~500,000 full patient records |
| Railway | $5 credit / month | Small–medium clinic with comfortable headroom |
| Vercel | 100 GB bandwidth / month | Thousands of concurrent staff + patient sessions |
| Cloudinary | 25 GB storage | Thousands of X-rays and scanned consent PDFs |

All four scale to paid tiers when you need it. Same APIs, same code — no migration required.

---

## 11. Launch Checklist

- [ ] Create Neon account → run `schema.sql` → verify 27 tables and 5 views exist
- [ ] Confirm: `SELECT COUNT(*) FROM procedures;` returns **23**
- [ ] Replace the placeholder admin password hash with a real bcrypt hash
- [ ] Create Railway project → push API → confirm `GET /health` returns `{ ok: true }`
- [ ] Create Vercel project → push frontend → confirm login page loads
- [ ] Create Cloudinary account → add Cloud Name, API Key, API Secret to Railway env vars
- [ ] Set `FRONTEND_URL` in Railway to your actual Vercel domain (required for CORS)
- [ ] Set `NODE_ENV=production` on Railway
- [ ] Test full happy path: login → create patient → book appointment → record treatment → generate invoice → record payment
- [ ] Confirm `audit_logs` rows are being written after mutations
- [ ] Confirm `vw_todays_schedule` returns data after booking a test appointment for today

---

## 12. Notes for the Team

**Schema changes** — use Neon branches. Create a `dev` branch, run your `ALTER TABLE` migrations there, test, then apply to `main`. Never run migrations directly on the production branch.

**Passwords** — `bcryptjs` with 12 rounds. The seed hash is a placeholder and will fail bcrypt.compare until replaced.

**Indexes** — every FK and common filter column is indexed. Run `EXPLAIN ANALYZE` before adding new indexes — many queries are already covered.

**Views** — the 5 dashboard views are your friend. Use them in route handlers instead of rewriting the JOINs. They're maintained here.

**Cloudinary folders** — keep the `dentiflow/clinic-{id}/patient-{id}/` path pattern. It makes bulk operations and access control straightforward.

**Notifications** — write to the `notifications` table synchronously, then dispatch (email/SMS) asynchronously in a `node-cron` job or a queue worker. Never await an SMS send inside a request handler.

**Audit logs** — the `auditLog.js` middleware fires after the response is sent (`res.on('finish', ...)`). It should never block a request.

**Multi-clinic** — the schema is ready. The API just needs `WHERE clinic_id = req.user.clinicId` on every query. Do not forget this or users will see other clinics' data.