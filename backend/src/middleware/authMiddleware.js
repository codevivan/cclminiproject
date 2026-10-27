const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * Protect routes - verifies JWT from HTTP-only cookie or Bearer header
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Read token from HTTP-only cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization Header (Bearer)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret_for_development_only'
    );

    // Fetch user from DB to ensure user still exists, role hasn't changed, and account is active
    const users = await query(
      'SELECT id, name, email, role, is_active, avatar_url, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (users[0].is_active === 0 || users[0].is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact canteen administration.'
      });
    }

    // Attach user payload to request
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server authentication error.'
    });
  }
};

/**
 * Restrict access to specified roles
 * @param  {...string} roles - e.g. 'OWNER', 'STUDENT'
 */
const authorize = (...roles) => {
  const normalizedAllowed = roles.map((r) => {
    const upper = String(r).toUpperCase();
    return upper === 'ADMIN' ? 'OWNER' : upper;
  });

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const userRole = String(req.user.role || '').toUpperCase();
    const normalizedUserRole = userRole === 'ADMIN' ? 'OWNER' : userRole;

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.'
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
