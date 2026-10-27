const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, query } = require('../config/db');

/**
 * Helper to generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret_for_development_only',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * Cookie options helper for secure HTTP-only cookies
 */
const getCookieOptions = (customDays) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const days = customDays || Number(process.env.COOKIE_EXPIRES_IN_DAYS) || 1;

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/'
  };
};

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * @route   GET /api/auth/google
 * @desc    Redirect to Google OAuth consent screen
 * @access  Public
 */
const initiateGoogleAuth = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Google OAuth Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in .env');
    return res.redirect(
      `${getClientUrl()}/login?error=${encodeURIComponent(
        'Google OAuth is not configured on the server. Please check environment variables.'
      )}`
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(googleAuthUrl);
};

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback, exchange token, find or create student user, issue cookie
 * @access  Public
 */
const googleCallback = async (req, res) => {
  const clientUrl = getClientUrl();

  try {
    const { code, error } = req.query;

    if (error) {
      console.warn('Google OAuth returned error query:', error);
      return res.redirect(
        `${clientUrl}/login?error=${encodeURIComponent(
          'Google authentication was canceled or denied.'
        )}`
      );
    }

    if (!code) {
      return res.redirect(
        `${clientUrl}/login?error=${encodeURIComponent('No authorization code received from Google.')}`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

    // 1. Exchange authorization code for access token & id_token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to exchange Google OAuth code:', tokenData);
      return res.redirect(
        `${clientUrl}/login?error=${encodeURIComponent(
          tokenData.error_description || 'Failed to authenticate with Google.'
        )}`
      );
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const googleUser = await userInfoResponse.json();

    if (!userInfoResponse.ok || !googleUser.email) {
      console.error('Failed to fetch Google user profile:', googleUser);
      return res.redirect(
        `${clientUrl}/login?error=${encodeURIComponent('Failed to retrieve user info from Google.')}`
      );
    }

    const { sub: googleId, email, name, picture } = googleUser;
    const normalizedEmail = email.toLowerCase().trim();
    const displayName = name || normalizedEmail.split('@')[0];

    // 3. Find or create user in MySQL database
    const existingUsers = await query(
      'SELECT id, name, email, role, avatar_url, google_id, auth_provider, created_at FROM users WHERE google_id = ? OR email = ?',
      [googleId, normalizedEmail]
    );

    let authenticatedUser;

    if (existingUsers && existingUsers.length > 0) {
      authenticatedUser = existingUsers[0];

      // Security Check: Google login cannot be used to bypass Owner credentials or escalate privilege
      if (String(authenticatedUser.role).toUpperCase() === 'OWNER' || String(authenticatedUser.role).toUpperCase() === 'ADMIN') {
        console.warn(`Attempt to sign in to OWNER account (${normalizedEmail}) via Google OAuth.`);
        return res.redirect(
          `${clientUrl}/login?error=${encodeURIComponent(
            'Owner accounts must sign in using official owner email and password credentials.'
          )}`
        );
      }

      // Ensure user has student role
      authenticatedUser.role = 'STUDENT';

      // Update google_id and avatar if missing
      await query(
        'UPDATE users SET google_id = COALESCE(google_id, ?), avatar_url = COALESCE(avatar_url, ?), auth_provider = IF(auth_provider IS NULL, "google", auth_provider) WHERE id = ?',
        [googleId, picture || null, authenticatedUser.id]
      );
    } else {
      // 4. Create new user account - ALWAYS assigned 'STUDENT' role
      const insertResult = await query(
        'INSERT INTO users (name, email, role, google_id, avatar_url, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
        [displayName, normalizedEmail, 'STUDENT', googleId, picture || null, 'google']
      );

      const createdUsers = await query(
        'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?',
        [insertResult.insertId]
      );
      authenticatedUser = createdUsers[0];
    }

    // 5. Generate application JWT and set HTTP-only cookie
    const token = generateToken(authenticatedUser);
    res.cookie('token', token, getCookieOptions());

    // 6. Redirect to Student Dashboard
    return res.redirect(`${clientUrl}/student/dashboard`);
  } catch (err) {
    console.error('Error during Google OAuth callback:', err);
    return res.redirect(
      `${clientUrl}/login?error=${encodeURIComponent(
        'An unexpected error occurred during Google Sign-In. Please try again.'
      )}`
    );
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student account (Always STUDENT role; Owner cannot be created here)
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password with bcrypt (12 rounds)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Enforce role = 'STUDENT'. Students cannot register as Owner under any circumstances.
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role, auth_provider) VALUES (?, ?, ?, "STUDENT", "local")',
      [name, email, passwordHash]
    );

    const newUserId = result.insertId;

    // Fetch created user without password_hash
    const users = await query(
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?',
      [newUserId]
    );
    const newUser = users[0];

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(newUser);
    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete registration. Please try again later.'
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user (student/admin) & set cookie
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Retrieve user including password_hash for comparison
    const users = await query(
      'SELECT id, name, email, password_hash, role, avatar_url, auth_provider, created_at FROM users WHERE email = ?',
      [email]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Check if account was created via Google without a local password
    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'This account is linked with Google Sign-In. Please sign in with Google.'
      });
    }

    // Compare bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Strip password_hash from response payload
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    };

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(safeUser);
    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log in. Please try again later.'
    });
  }
};

/**
 * @route   POST /api/auth/logout & GET /api/auth/logout
 * @desc    Clear authentication cookie
 * @access  Public (or Authenticated)
 */
const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });

    // If request accepts HTML (direct browser navigation), redirect to login
    if (req.accepts('html')) {
      return res.redirect(`${getClientUrl()}/login`);
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log out.'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user info
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
};

/**
 * @route   PUT /api/auth/update-password
 * @desc    Update password for logged in user (with old password verification)
 * @access  Private
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your current and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const [user] = await query('SELECT id, password_hash FROM users WHERE id = ?', [userId]);
    if (!user || !user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot be updated for social login accounts without a local password.'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match our records.'
      });
    }

    const saltRounds = 12;
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    console.error('updatePassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update password.'
    });
  }
};

/**
 * @route   GET /api/auth/owner-status
 * @desc    Check whether an Owner account already exists in MySQL
 * @access  Public
 */
const getOwnerStatus = async (req, res) => {
  try {
    const owners = await query('SELECT id, name, email FROM users WHERE role = "OWNER"');
    const ownerExists = Boolean(owners && owners.length > 0);
    return res.status(200).json({
      success: true,
      ownerExists,
      message: ownerExists
        ? 'An Owner account has already been configured. Please sign in.'
        : 'No Owner account found. First-time Owner setup is available.'
    });
  } catch (error) {
    console.error('getOwnerStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify Owner status. Please check database connectivity.'
    });
  }
};

/**
 * @route   POST /api/auth/owner-setup
 * @desc    Controlled First-Time Owner Account Creation (Enforces exactly ONE Owner)
 * @access  Public (Allowed strictly when 0 owners exist)
 */
const setupOwner = async (req, res) => {
  let connection;
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the Owner full name (at least 2 characters).'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
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

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please verify your entries.'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // CRITICAL SECURITY ENFORCEMENT: Exclusive lock check across users table
    const [existingOwners] = await connection.execute(
      'SELECT id, name, email FROM users WHERE role = "OWNER" FOR UPDATE'
    );

    if (existingOwners && existingOwners.length > 0) {
      await connection.rollback();
      connection.release();
      connection = null;
      return res.status(403).json({
        success: false,
        message: 'An Owner account has already been configured. Please sign in.'
      });
    }

    // Check if email already used by any user
    const [existingEmail] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    if (existingEmail && existingEmail.length > 0) {
      await connection.rollback();
      connection.release();
      connection = null;
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt (12 rounds)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password_hash, role, auth_provider) VALUES (?, ?, ?, "OWNER", "local")',
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );

    await connection.commit();
    connection.release();
    connection = null;

    const newOwnerId = result.insertId;
    const owners = await query(
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?',
      [newOwnerId]
    );
    const newOwner = owners[0];

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(newOwner);
    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Owner account created successfully! Welcome to CanteenFlow.',
      token,
      user: newOwner
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
    }
    console.error('setupOwner error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Owner account. Please try again.'
    });
  }
};

/**
 * @route   POST /api/auth/owner-login
 * @desc    Dedicated Sign In for Canteen Owner (strictly enforces role: 'OWNER')
 * @access  Public
 */
const ownerLogin = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const users = await query(
      'SELECT id, name, email, password_hash, role, avatar_url, auth_provider, is_active, created_at FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Check account active status
    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact technical administration.'
      });
    }

    // CRITICAL ROLE ENFORCEMENT: Must be OWNER
    const roleUpper = String(user.role || '').toUpperCase();
    if (roleUpper !== 'OWNER' && roleUpper !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This portal is strictly reserved for Canteen Owners. Students please sign in via the Student Portal.'
      });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'This account does not have a local password set.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'OWNER',
      avatar_url: user.avatar_url,
      created_at: user.created_at
    };

    const cookieDays = rememberMe ? 30 : 1;
    const token = generateToken(safeUser);
    res.cookie('token', token, getCookieOptions(cookieDays));

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully. Welcome to CanteenFlow!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('ownerLogin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate Owner. Please try again.'
    });
  }
};

module.exports = {
  initiateGoogleAuth,
  googleCallback,
  register,
  login,
  logout,
  getMe,
  updatePassword,
  getOwnerStatus,
  setupOwner,
  ownerLogin
};
