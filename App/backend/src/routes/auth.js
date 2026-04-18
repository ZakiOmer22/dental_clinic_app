const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { logAction, logSecurityEvent } = require('../../utils/auditLogger');

// ─── Token Generation Helpers ────────────────────────────────────────────────
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// ─── Configure Email Transporter (real SMTP) ─────────────────────────────────
let transporter;
async function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Helper to get logo URL (fallback to frontend URL + /logo.png)
function getLogoUrl() {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/logo.png`; // place your logo.png in public folder
}

// Helper to get favicon URL
function getFaviconUrl() {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/favicon.ico`;
}

// DEBUG – check password hash (remove after fixing)
router.post('/debug-hash', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!rows.length) return res.json({ error: 'User not found' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    res.json({
      id: user.id,
      email: user.email,
      hash: user.password_hash,
      password_match: match
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── REFRESH TOKEN (Enhanced with DB support) ────────────────────────────────
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const oldAccessToken = req.cookies.token;

    // If we have a refresh token, validate it from database
    if (refreshToken) {
      const { rows } = await pool.query(
        `SELECT * FROM refresh_tokens 
         WHERE token = $1 
           AND (revoked_at IS NULL OR revoked_at IS NULL) 
           AND expires_at > NOW()`,
        [refreshToken]
      );

      if (rows.length === 0) {
        res.clearCookie('token');
        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }

      const tokenData = rows[0];

      // Get fresh user data
      const { rows: userRows } = await pool.query(
        `SELECT id, clinic_id, email, role, is_active 
         FROM users WHERE id = $1`,
        [tokenData.user_id]
      );

      const user = userRows[0];
      if (!user || !user.is_active) {
        res.clearCookie('token');
        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
        return res.status(403).json({ error: "Account disabled or not found" });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user.id,
          clinicId: user.clinic_id,
          role: user.role,
          email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.cookie("token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      return res.json({ accessToken: newAccessToken });
    }

    // 🔥 FALLBACK: No refresh token, use access token (your original logic)
    const tokenToUse = oldAccessToken;

    if (!tokenToUse) {
      return res.status(401).json({ error: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tokenToUse, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        clinicId: decoded.clinicId,
        role: decoded.role,
        email: decoded.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(401).json({ error: "Refresh failed" });
  }
});

// LOGIN (Enhanced with Refresh Token)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      `SELECT id, clinic_id, full_name, email, password_hash, role, is_active
       FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];

    // ADD THIS: Log failed login - user not found
    if (!user) {
      await logSecurityEvent({
        user: null,
        eventType: 'LOGIN_FAILED',
        severity: 'warning',
        details: { email, reason: 'user_not_found' },
        req
      }).catch(() => { });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ADD THIS: Log failed login - account disabled
    if (!user.is_active) {
      await logSecurityEvent({
        user: { id: user.id, clinicId: user.clinic_id },
        eventType: 'LOGIN_FAILED',
        severity: 'warning',
        details: { email, reason: 'account_disabled' },
        req
      }).catch(() => { });
      return res.status(403).json({ error: 'Account disabled' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    // ADD THIS: Log failed login - wrong password
    if (!valid) {
      await logSecurityEvent({
        user: { id: user.id, clinicId: user.clinic_id },
        eventType: 'LOGIN_FAILED',
        severity: 'warning',
        details: { email, reason: 'invalid_password' },
        req
      }).catch(() => { });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      clinicId: user.clinic_id,
      role: user.role,
      email: user.email,
    };

    // Create access token (15 minutes)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Create refresh token (30 days, stored in DB)
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
      // Continue even if refresh token storage fails
    }

    // Set access token cookie (15 minutes)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    // Set refresh token cookie (30 days)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    // Log successful login
    await logAction({
      user: { id: user.id, clinicId: user.clinic_id },
      action: 'LOGIN_SUCCESS',
      entity: 'user',
      entityId: user.id,
      metadata: { email: user.email },
      req
    }).catch(() => { });

    // ADD THIS: Log security event for successful login
    await logSecurityEvent({
      user: { id: user.id, clinicId: user.clinic_id },
      eventType: 'LOGIN_SUCCESS',
      severity: 'info',
      details: { email: user.email },
      req
    }).catch(() => { });

    res.json({
      token,
      user: {
        id: user.id,
        clinicId: user.clinic_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);

    // ADD THIS: Log system error
    await logSecurityEvent({
      user: null,
      eventType: 'LOGIN_ERROR',
      severity: 'error',
      details: { email: req.body.email, error: err.message },
      req
    }).catch(() => { });

    res.status(500).json({ error: 'Server error' });
  }
});

// REGISTER (ADMIN ONLY)
router.post('/register', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { fullName, email, password, role, clinicId } = req.body;

    const hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (clinic_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, clinic_id, full_name, email, role`,
      [clinicId, fullName, email.toLowerCase(), hash, role]
    );

    res.status(201).json({ user: rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGOUT (Enhanced - revokes refresh token)
router.post('/logout', auth, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Mark refresh token as revoked
      await pool.query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1`,
        [refreshToken]
      );
    }

    // ADD THIS: Log logout
    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'LOGOUT',
      entity: 'user',
      entityId: req.user.id,
      req
    }).catch(() => { });

  } catch (err) {
    console.error('Logout error (non-critical):', err);
  }

  // Always clear cookies
  res.clearCookie('token');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ ok: true });
});

// ME
router.get('/me', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, clinic_id, full_name, email, role FROM users WHERE id = $1`,
    [req.user.id]
  );
  res.json(rows[0]);
});

// ─── Forgot Password - Send Email (Professional Template) ─────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { rows } = await pool.query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Create temp_reset_tokens table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temp_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Delete any existing tokens for this user
    await pool.query('DELETE FROM temp_reset_tokens WHERE user_id = $1', [user.id]);

    // Store new token
    await pool.query(
      'INSERT INTO temp_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const logoUrl = getLogoUrl();
    const faviconUrl = getFaviconUrl();
    const currentYear = new Date().getFullYear();

    // Professional HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <link rel="shortcut icon" href="${faviconUrl}">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f7f9;
            color: #333;
          }
          .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0,0,0,0.05);
          }
          .header {
            background: linear-gradient(135deg, #0d9e75 0%, #0b8a66 100%);
            padding: 32px 24px;
            text-align: center;
          }
          .logo {
            max-width: 80px;
            margin-bottom: 16px;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.3px;
          }
          .header p {
            color: rgba(255,255,255,0.85);
            margin: 8px 0 0;
            font-size: 14px;
          }
          .content {
            padding: 40px 32px;
          }
          .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #1e2a3a;
          }
          .message {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 28px;
            color: #4a5568;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .reset-button {
            display: inline-block;
            background-color: #0d9e75;
            color: white !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 16px;
            letter-spacing: 0.3px;
            box-shadow: 0 4px 12px rgba(13,158,117,0.25);
            transition: all 0.2s ease;
          }
          .reset-button:hover {
            background-color: #0b8a66;
            transform: translateY(-1px);
          }
          .link-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            margin: 24px 0;
            word-break: break-all;
            font-size: 13px;
            color: #2d3748;
          }
          .link-label {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #4a5568;
          }
          .link-value {
            font-family: monospace;
            background: white;
            padding: 8px;
            border-radius: 8px;
            font-size: 12px;
          }
          .alert {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 24px 0;
            border-radius: 8px;
            font-size: 14px;
            color: #b91c1c;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 32px;
            text-align: center;
            font-size: 12px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
          }
          .footer a {
            color: #0d9e75;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .content { padding: 24px; }
            .reset-button { padding: 12px 24px; font-size: 14px; }
          }
        </style>
      </head>
      <body style="margin:0;padding:20px;background:#f4f7f9;">
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Dental Clinic Portal" class="logo" style="width:64px;height:64px;">
            <h1>Dental Clinic Portal</h1>
            <p>Secure Practice Management</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${user.full_name},</div>
            <div class="message">
              We received a request to reset the password for your Dental Clinic Portal account. 
              Click the button below to choose a new password.
            </div>
            <div class="button-container">
              <a href="${resetLink}" class="reset-button">Reset Password →</a>
            </div>
            <div class="link-box">
              <div class="link-label">🔗 Or copy this link into your browser:</div>
              <div class="link-value">${resetLink}</div>
            </div>
            <div class="alert">
              <strong>⏰ Security notice:</strong> This link will expire in <strong>1 hour</strong> and can only be used once.
            </div>
            <div class="message" style="font-size:14px;margin-top:16px;">
              If you didn't request this, please ignore this email. Your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>© ${currentYear} Dental Clinic Portal – All rights reserved.</p>
            <p>Powered by <strong>eALIF Team Suite</strong> | <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL || 'localhost'}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send real email
    try {
      const transporter = await getTransporter();
      const mailOptions = {
        from: '"Dental Clinic Portal" <noreply@dentalclinic.com>',
        to: user.email,
        subject: 'Reset Your Password - Dental Clinic Portal',
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);

      // Preview URL only for Ethereal (if using test account) – but with real SMTP it won't appear
      const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;

      console.log(`\n✅ Password reset email sent to ${user.email}`);
      if (previewUrl) console.log(`   Preview URL: ${previewUrl}`);
      console.log(`   Reset Link: ${resetLink}\n`);

      res.json({
        message: 'Password reset link has been sent to your email.',
        previewUrl: previewUrl,
        resetLink: resetLink,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return the reset link so user can copy it manually
      res.json({
        message: 'If an account exists, a reset link has been sent.',
        resetLink: resetLink,
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Reset Password - Update password with token ──────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find valid reset token
    const { rows } = await pool.query(
      `SELECT user_id FROM temp_reset_tokens 
       WHERE token = $1 AND expires_at > NOW() AND used = false`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const userId = rows[0].user_id;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    // Mark token as used
    await pool.query('UPDATE temp_reset_tokens SET used = true WHERE token = $1', [token]);

    console.log(`✅ Password reset successfully for user ID: ${userId}`);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Verify Reset Token (check validity without changing password) ───────────
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'No token provided' });
    }

    const { rows } = await pool.query(
      `SELECT user_id, expires_at, used 
       FROM temp_reset_tokens 
       WHERE token = $1`,
      [token]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, error: 'Invalid reset token.' });
    }

    const tokenData = rows[0];

    if (tokenData.used) {
      return res.json({ valid: false, error: 'This reset link has already been used.' });
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return res.json({ valid: false, error: 'This reset link has expired. Please request a new one.' });
    }

    // Token is valid
    return res.json({ valid: true });
  } catch (err) {
    console.error('Verify token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;