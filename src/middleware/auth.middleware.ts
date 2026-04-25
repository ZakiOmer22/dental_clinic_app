const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

async function authMiddleware(req, res, next) {
  try {
    // Check cookie first, then Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const { rows } = await pool.query(
      `SELECT id, clinic_id, email, role, is_active 
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    
    const user = rows[0];
    if (!user || !user.is_active) {
      // Clear invalid cookies
      res.clearCookie('token');
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return res.status(403).json({ error: 'Account disabled or not found' });
    }

    req.user = {
      id: user.id,
      clinicId: user.clinic_id,
      email: user.email,
      role: user.role,
    };
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Don't clear cookies here - client should use /refresh endpoint
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;