
<div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
  <img src="../Front_End/public/icon.png" alt="Logo" width="52" height="52" style="border-radius: 12px;" />
  <div>
    <div style="display: flex; align-items: baseline; gap: 8px;">
      <span style="font-size: 20px; font-weight: 700; color: #F80000;">eALIF Team</span>
      <span style="font-size: 16px; font-weight: 500; color: #FC1D00;">Production</span>
    </div>
    <h1 style="margin: 4px 0 0; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #0d9e75, #6d28d9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
      Daryeel API — Backend Services
    </h1>
  </div>
</div>

---

# 🚀 Daryeel Backend API

Enterprise-grade REST API for multi-clinic dental practice management. Built with **Node.js**, **Express**, and **PostgreSQL**. Handles authentication, clinic subscriptions, billing, and all core dental clinic operations.

## 📦 Tech Stack

| Category       | Technology                          |
|----------------|-------------------------------------|
| Runtime        | Node.js 20+                         |
| Framework      | Express.js                          |
| Database       | PostgreSQL (Neon Serverless)        |
| Authentication | JWT (access + refresh tokens)       |
| Payments       | Stripe, Telesom, eDahab             |
| File Storage   | Cloudinary                          |
| Email          | Nodemailer (Gmail SMTP)             |
| Validation     | Joi                                 |
| Security       | Helmet, CORS, Rate Limiting         |
| Logging        | Morgan                              |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── api/
│   │   └── v1/
│   │       ├── routes/           # Express route definitions
│   │       │   ├── adminRoutes.js
│   │       │   ├── authRoutes.js
│   │       │   ├── patientRoutes.js
│   │       │   ├── appointmentRoutes.js
│   │       │   ├── billingRoutes.js
│   │       │   ├── subscriptionRoutes.js
│   │       │   └── ...
│   │       ├── controllers/      # Request handlers
│   │       │   ├── authController.js
│   │       │   ├── patientController.js
│   │       │   └── ...
│   │       ├── middlewares/      # Custom middleware
│   │       │   ├── auth.js
│   │       │   ├── validate.js
│   │       │   └── errorHandler.js
│   │       └── validators/       # Joi validation schemas
│   │           └── authValidator.js
│   ├── services/                 # Business logic layer
│   │   ├── authService.js
│   │   ├── subscriptionService.js
│   │   ├── emailService.js
│   │   └── paymentService.js
│   ├── db/
│   │   └── pool.js               # PostgreSQL connection pool
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── responseHandler.js
│   │   ├── auditLogger.js
│   │   ├── tokens.js
│   │   └── permissions.js
│   └── server.js                 # Entry point
├── migrations/                   # SQL migration files
├── scripts/                      # Utility scripts
├── backups/                      # Database backups
├── .env                          # Environment variables
├── .env.production               # Production environment
├── package.json
├── render.yaml                   # Render deployment config
└── vercel.json                   # Vercel deployment config
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the backend root:

```env
# ── App ───────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# ── Database ─────────────────────────────────────────────────
DATABASE_URL=postgresql://neondb_owner:...@ep-....aws.neon.tech/neondb?sslmode=require

# ── Auth ──────────────────────────────────────────────────────
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# ── Stripe ─────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Cloudinary ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Email (Gmail SMTP) ────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# ── SaaS Settings ─────────────────────────────────────────────
TRIAL_DAYS=14
DEFAULT_PLAN=basic

# ── Telesom SMS ───────────────────────────────────────────────
TELESOM_SENDER_ID=your_sender_id
TELESOM_USERNAME=your_username
TELESOM_PASSWORD=your_password

# ── eDahab ────────────────────────────────────────────────────
EDAHAB_API_URL=https://api.edahab.net/v1
EDAHAB_MERCHANT_ID=your_merchant_id
EDAHAB_API_KEY=your_api_key

# ── Rate Limiting ─────────────────────────────────────────────
DISABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

Run the migration scripts in order:

```bash
# Connect to your PostgreSQL database and execute:
psql -d your_database -f migrations/001_create_tables.sql
psql -d your_database -f migrations/002_add_indexes.sql
psql -d your_database -f migrations/003_seed_data.sql
```

Or use the Neon SQL Editor to run the migration files.

### 4. Create Super Admin User

```sql
-- Generate bcrypt hash for password 'admin123'
INSERT INTO users (email, password_hash, full_name, role, is_active, created_at)
VALUES ('admin@daryeel.so', '$2b$10$...', 'Super Admin', 'super_admin', true, NOW());
```

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`.

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint              | Description                    | Auth Required |
|--------|-----------------------|--------------------------------|---------------|
| POST   | `/auth/register`      | Register new clinic/admin      | No            |
| POST   | `/auth/login`         | Login, returns tokens          | No            |
| POST   | `/auth/refresh`       | Refresh access token           | No (cookie)   |
| POST   | `/auth/logout`        | Logout, invalidate tokens      | Yes           |
| POST   | `/auth/forgot-password` | Request password reset       | No            |
| POST   | `/auth/reset-password`  | Reset password with token    | No            |
| GET    | `/auth/me`            | Get current user profile       | Yes           |

### Admin Endpoints (Super Admin)

| Method | Endpoint                       | Description                      |
|--------|--------------------------------|----------------------------------|
| GET    | `/admin/dashboard`             | Platform KPIs and stats          |
| GET    | `/admin/clinics`               | List all clinics                 |
| POST   | `/admin/clinics`               | Create new clinic                |
| GET    | `/admin/clinics/:id`           | Get clinic details               |
| PUT    | `/admin/clinics/:id`           | Update clinic                    |
| POST   | `/admin/clinics/:id/suspend`   | Suspend clinic                   |
| POST   | `/admin/clinics/:id/activate`  | Activate clinic                  |
| GET    | `/admin/clinics/pending`       | Pending approval clinics         |
| POST   | `/admin/clinics/:id/approve`   | Approve clinic                   |
| POST   | `/admin/clinics/:id/reject`    | Reject clinic                    |
| GET    | `/admin/users`                 | List all platform users          |
| GET    | `/admin/analytics`             | Revenue and growth analytics     |
| GET    | `/admin/usage`                 | Platform usage metrics           |
| GET    | `/admin/feature-requests`      | List feature requests            |
| PATCH  | `/admin/feature-requests/:id`  | Update request status            |
| GET    | `/admin/tickets`               | Support tickets                  |
| GET    | `/admin/payments`              | Payment history                  |
| GET    | `/admin/invoices`              | All invoices                     |
| GET    | `/admin/audit-logs`            | Activity log                     |
| GET    | `/admin/health`                | System health check              |

### Clinic-Specific Endpoints

| Method | Endpoint                                | Description                    |
|--------|-----------------------------------------|--------------------------------|
| GET    | `/admin/clinics/:id/patients`           | Clinic patients                |
| GET    | `/admin/clinics/:id/appointments`       | Clinic appointments            |
| GET    | `/admin/clinics/:id/treatments`         | Clinic treatments              |
| GET    | `/admin/clinics/:id/prescriptions`      | Clinic prescriptions           |
| GET    | `/admin/clinics/:id/lab-orders`         | Clinic lab orders              |
| GET    | `/admin/clinics/:id/inventory`          | Clinic inventory               |
| GET    | `/admin/clinics/:id/staff`              | Clinic staff members           |

### Subscription & Billing

| Method | Endpoint                       | Description                      |
|--------|--------------------------------|----------------------------------|
| GET    | `/subscriptions/current`       | Current user subscription        |
| GET    | `/subscriptions/plans`         | Available subscription plans     |
| GET    | `/subscriptions/usage`         | Current usage vs limits          |
| POST   | `/subscriptions/checkout`      | Create Stripe checkout session   |
| POST   | `/subscriptions/portal`        | Customer billing portal          |
| POST   | `/subscriptions/cancel`        | Cancel subscription              |
| GET    | `/subscriptions/invoices`      | Invoice history                  |

### Webhooks

| Method | Endpoint                    | Description             |
|--------|-----------------------------|-------------------------|
| POST   | `/webhooks/stripe`          | Stripe events           |
| POST   | `/webhooks/edahab`          | eDahab payment events   |

---

## 🔐 Authentication Flow

1. **Login**: `POST /auth/login` returns `accessToken` in response body and `refreshToken` in HTTP-only cookie.
2. **Access Protected Routes**: Include `Authorization: Bearer <accessToken>` header.
3. **Token Expired**: Frontend automatically calls `/auth/refresh` using the refresh token cookie to get a new access token.
4. **Logout**: `POST /auth/logout` invalidates the refresh token and clears cookies.

---

## 🗄️ Database Schema Overview

| Table                    | Description                               |
|--------------------------|-------------------------------------------|
| `clinics`                | Registered dental clinics                 |
| `clinic_subscriptions`   | Subscription status per clinic            |
| `subscription_plans`     | Available plans (Basic, Pro, Enterprise)  |
| `subscription_invoices`  | Billing history                           |
| `users`                  | Staff and admin accounts                  |
| `patients`               | Patient records                           |
| `appointments`           | Scheduled appointments                    |
| `treatments`             | Dental procedures performed               |
| `prescriptions`          | Medication prescriptions                  |
| `lab_orders`             | Dental lab work orders                    |
| `inventory_items`        | Clinic inventory stock                    |
| `support_tickets`        | Customer support tickets                  |
| `feature_requests`       | Platform feature requests                 |
| `audit_logs`             | Activity tracking                         |
| `platform_settings`      | Global platform configuration             |
| `clinic_settings`        | Per-clinic configuration                  |

---

## 📜 Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run test       # Run test suite (when available)
```

---

## 🔒 Security Features

- **JWT** with short-lived access tokens (15 min) and long-lived refresh tokens (30 days)
- **HTTP-only cookies** for refresh tokens (prevents XSS)
- **Helmet.js** for security headers
- **CORS** configured for frontend origin only
- **Rate limiting** on authentication endpoints
- **Input validation** with Joi
- **SQL injection protection** via parameterized queries
- **Audit logging** for all sensitive actions
- **Role-based access control (RBAC)**

---

## 📜 License

**Daryeel** is proprietary software developed and owned by **eALIF Team Solutions**. All rights reserved.

### Terms of Use

This software is licensed, not sold. By accessing or using the platform, you agree to the following:

- ✅ **Permitted Use**: Authorized clinics and their staff may use the platform for legitimate dental practice management purposes.
- ❌ **Restrictions**: You may not copy, modify, distribute, sell, sublicense, reverse engineer, or create derivative works of the software without explicit written permission.
- 🔒 **Confidentiality**: All patient data, clinic information, and platform metrics remain the property of the respective clinic and are protected under applicable data protection laws.
- ⚖️ **Liability**: The software is provided "as is" without warranty of any kind. eALIF Team Solutions is not liable for any damages arising from the use or inability to use the platform.

### Source Code Access

Source code is provided exclusively to paying enterprise customers under a separate **Enterprise License Agreement (ELA)**. For inquiries about source code access or custom deployments, contact:

📧 **legal@ealifteam.so**

---

*© 2025–2026 eALIF Team Solutions. All rights reserved. Unauthorized reproduction or distribution is strictly prohibited.*