# 🦷 DentiFlow — Dental Clinic Management System

A full-stack dental clinic management system built with **React + TypeScript + Firebase**.

## Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Frontend   | React 18 + Vite + TypeScript  |
| Styling    | Tailwind CSS                  |
| Routing    | React Router v6               |
| State      | Zustand                       |
| Backend    | Firebase (Firestore + Auth + Storage) |
| Toasts     | react-hot-toast               |
| Icons      | lucide-react                  |

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create a Firebase project at https://console.firebase.google.com

Enable:
- **Authentication** → Email/Password
- **Firestore Database**
- **Storage**

Copy your config into `.env`:

```env
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MSG_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
```

### 3. Deploy Firestore Rules

Copy `firestore.rules` content into Firebase Console → Firestore → Rules tab.

### 4. Create your first admin user

In Firebase Console → Authentication → Add User manually.

### 5. Start the dev server

```bash
npm run dev
```

---

## 📁 Project Structure

```
src/
├── app/            # Zustand stores
├── ai/             # AI engine (SoorGreen — ready for integration)
├── components/     # Reusable UI: Button, Input, Modal, Table, Avatar...
├── constants/      # Roles, statuses, nav items
├── features/       # Reserved for feature-level modules
├── hooks/          # useAuth, usePatients...
├── layouts/        # DashboardLayout, Sidebar, Topbar
├── pages/          # All route pages
├── services/       # Firebase services (auth, patients, appointments...)
├── styles/         # Global CSS + Tailwind
└── utils/          # formatDate, formatCurrency, statusColor...
```

---

## ✅ Features (v1)

- [x] Firebase Authentication (login / logout)
- [x] Patient Management (CRUD + search)
- [x] Patient Profile (appointments, treatments, billing tabs)
- [x] Appointment Scheduling (with status management)
- [x] Treatment Records
- [x] Billing & Invoices
- [x] Dashboard with KPIs
- [x] Reports & Analytics
- [x] Collapsible Sidebar
- [x] Role-aware structure

## 🔹 Planned (v2)

- [ ] File Upload (X-rays via Firebase Storage)
- [ ] Notifications
- [ ] PDF report export
- [ ] Staff management

## 🔹 AI (v3 — SoorGreen Engine)

- [ ] Diagnosis suggestions
- [ ] Patient risk scoring
- [ ] Chatbot assistant
- AI stubs already in `src/ai/`

---

## TypeScript Notes

- `strict: false` — no type errors will block you
- `noImplicitAny: false` — use `any` freely
- No ESLint configured — clean, no warnings
```
