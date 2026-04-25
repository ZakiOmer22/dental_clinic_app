# ============================================================
# DENTIFLOW FRONTEND — SETUP COMMANDS
# Run these in your terminal inside the project folder
# ============================================================

# ── STEP 1: Go into the project ──────────────────────────────
cd dental-clinic-app

# ── STEP 2: Remove Firebase, install correct packages ────────
npm remove firebase

npm install \
  @tanstack/react-query \
  @tanstack/react-table \
  react-hook-form \
  zod \
  @hookform/resolvers \
  recharts \
  @fullcalendar/react \
  @fullcalendar/daygrid \
  @fullcalendar/timegrid \
  @fullcalendar/interaction

# These were already in package.json — confirm they stay:
# react, react-dom, react-router-dom, zustand, axios,
# date-fns, react-hot-toast, lucide-react, clsx

# ── STEP 3: Create folder structure ──────────────────────────
mkdir -p src/api
mkdir -p src/store
mkdir -p src/components/dental
mkdir -p src/components/layout

# ── STEP 4: Create .env (fill in your Render URL later) ──────
# Create a file called .env in the root with:
#
#   VITE_API_URL=http://localhost:3000
#
# When deployed to Vercel, change to:
#   VITE_API_URL=https://dentiflow-api.onrender.com

# ── STEP 5: Run dev server ────────────────────────────────────
npm run dev
# → http://localhost:5173

# ── STEP 6: Build for production ─────────────────────────────
npm run build
# Output goes to /dist — this is what Vercel deploys
