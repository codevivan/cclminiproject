/**
 * Input validation middleware for auth endpoints
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegister = (req, res, next) => {
  let { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters long.'
    });
  }

  if (name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Name cannot exceed 100 characters.'
    });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  // Sanitize and normalize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.password = password;

  next();
};

const validateLogin = (req, res, next) => {
  let { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Password is required.'
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

module.exports = {
  validateRegister,
  validateLogin
};
