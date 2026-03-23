const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // required for Neon
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Neon DB connection failed:', err.message);
  } else {
    console.log('✅ Connected to Neon PostgreSQL');
    release();
  }
});

module.exports = pool;
