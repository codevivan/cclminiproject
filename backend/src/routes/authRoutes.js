const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  initiateGoogleAuth,
  googleCallback,
  updatePassword,
  getOwnerStatus,
  setupOwner,
  ownerLogin
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

// Public Local Auth Endpoints (Rate-limited & Validated)
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Dedicated Canteen Owner Endpoints (Strict single-owner security)
router.get('/owner-status', getOwnerStatus);
router.post('/owner-setup', authLimiter, setupOwner);
router.post('/owner-login', authLimiter, ownerLogin);

// Google OAuth 2.0 Endpoints
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', googleCallback);

// Logout (Supports both POST API and GET browser navigation)
router.post('/logout', logout);
router.get('/logout', logout);

// Protected Auth Endpoints
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

// Role-protected verification endpoints (for testing & verification)
router.get('/student-only', protect, authorize('STUDENT'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized: Access granted to STUDENT resource.',
    user: req.user
  });
});

router.get('/owner-only', protect, authorize('OWNER'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized: Access granted to OWNER resource.',
    user: req.user
  });
});

// Backward compatibility alias for test suites
router.get('/admin-only', protect, authorize('OWNER'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized: Access granted to OWNER resource.',
    user: req.user
  });
});

module.exports = router;
