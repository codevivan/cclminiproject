const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for sensitive authentication endpoints (login, register)
 * Allows up to 20 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true, // Return standard rate limit headers (RateLimit-*)
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

module.exports = {
  authLimiter
};
