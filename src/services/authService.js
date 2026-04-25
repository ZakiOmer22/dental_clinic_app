const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/pool');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../utils/errors');

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email, password, req = null) {
    const { rows } = await pool.query(
      `SELECT id, clinic_id, full_name, email, password_hash, role, is_active
       FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }
    
    if (!user.is_active) {
      throw new AuthenticationError('Account is disabled');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const payload = {
      id: user.id,
      clinicId: user.clinic_id,
      role: user.role,
      email: user.email,
    };

    // Create tokens
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Store refresh token
    try {
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );
    } catch (dbErr) {
      console.error('Failed to store refresh token:', dbErr);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        clinicId: user.clinic_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken, oldAccessToken) {
    if (refreshToken) {
      const { rows } = await pool.query(
        `SELECT * FROM refresh_tokens 
         WHERE token = $1 
           AND revoked_at IS NULL 
           AND expires_at > NOW()`,
        [refreshToken]
      );

      if (rows.length === 0) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      const tokenData = rows[0];
      const { rows: userRows } = await pool.query(
        `SELECT id, clinic_id, email, role, is_active 
         FROM users WHERE id = $1`,
        [tokenData.user_id]
      );

      const user = userRows[0];
      if (!user || !user.is_active) {
        throw new AuthenticationError('Account disabled or not found');
      }

      const newAccessToken = jwt.sign(
        {
          id: user.id,
          clinicId: user.clinic_id,
          role: user.role,
          email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return { accessToken: newAccessToken };
    }

    // Fallback to access token
    if (!oldAccessToken) {
      throw new AuthenticationError('No token provided');
    }

    let decoded;
    try {
      decoded = jwt.verify(oldAccessToken, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      throw new AuthenticationError('Invalid token');
    }

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        clinicId: decoded.clinicId,
        role: decoded.role,
        email: decoded.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { accessToken: newAccessToken };
  }

  /**
   * Logout user - revoke refresh token
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await pool.query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1`,
        [refreshToken]
      );
    }
    return true;
  }

  /**
   * Get current user profile
   */
  async getMe(userId) {
    const { rows } = await pool.query(
      `SELECT id, clinic_id, full_name, email, role FROM users WHERE id = $1`,
      [userId]
    );

    if (!rows.length) {
      throw new NotFoundError('User');
    }

    return rows[0];
  }
}

module.exports = new AuthService();