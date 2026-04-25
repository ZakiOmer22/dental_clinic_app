const pool = require("../db/pool");

// count recent failed attempts
const getFailedAttempts = async (email) => {
  const result = await pool.query(
    `SELECT COUNT(*) 
     FROM login_attempts
     WHERE email=$1 AND success=false
     AND created_at > NOW() - INTERVAL '15 minutes'`,
    [email]
  );

  return parseInt(result.rows[0].count);
};

// lock rule
const isBlocked = async (email) => {
  const attempts = await getFailedAttempts(email);
  return attempts >= 5; // 🔐 threshold
};

module.exports = {
  getFailedAttempts,
  isBlocked,
};