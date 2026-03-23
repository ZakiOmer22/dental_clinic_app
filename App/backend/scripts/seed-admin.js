/**
 * Run this once to create your admin user:
 *   node backend/scripts/seed-admin.js   (from App directory)
 *
 * Then log in with the email + password you set below.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Create a dedicated pool for this script (avoid issues with existing pool)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
async function seedAdmin() {
  // ── CHANGE THESE ──────────────────────────────────────────
  const ADMIN_EMAIL = 'admin@mail.com';
  const ADMIN_PASSWORD = '12345678';       // change this!
  const ADMIN_NAME = 'System Admin';
  const CLINIC_ID = 1;
  // ──────────────────────────────────────────────────────────

  console.log(`🏥 Creating clinic with ID ${CLINIC_ID}...`);
  await pool.query(
    `INSERT INTO clinics (id, name, phone, email, address, city, country)
         VALUES ($1, 'Main Clinic', '+252 123 4567', 'clinic@smileclinic.so', 'Mogadishu', 'Mogadishu', 'Somalia')
         ON CONFLICT (id) DO NOTHING`,
    [CLINIC_ID]
  );
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Insert or update admin user
  await pool.query(
    `INSERT INTO users (clinic_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (email) DO UPDATE 
         SET password_hash = EXCLUDED.password_hash, 
             updated_at = NOW()`,
    [CLINIC_ID, ADMIN_NAME, ADMIN_EMAIL, hash]
  );

  console.log('✅ Admin user ready:');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('\n⚠️  Change your password after first login!');
  process.exit(0);
}

seedAdmin();