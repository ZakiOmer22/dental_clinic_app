const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // ✅ REQUIRED for Neon
  },
  max: 10,
  min: 2,                     // ✅ Keep 2 connections warm
  idleTimeoutMillis: 10000,   // ✅ Reduced from 30000 to match Neon's timeout
  connectionTimeoutMillis: 10000,
  keepAlive: true,            // ✅ Prevents connection termination
  keepAliveInitialDelayMillis: 5000,
});

// Error handler - prevents crashes when Neon kills idle connections
pool.on('error', (err) => {
  console.error('⚠️ DB pool error:', err.message);
  // Pool will auto-recover
});

// startup check
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to Neon PostgreSQL');
  } catch (err) {
    console.error('❌ Neon DB connection failed:', err.message);
  }
})();

module.exports = pool;