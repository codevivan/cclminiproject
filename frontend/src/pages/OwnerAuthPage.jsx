import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import AlertMessage from '../components/AlertMessage';
import {
  ChefHat,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Store,
  RefreshCw,
  HelpCircle,
  X,
  Terminal,
  UtensilsCrossed
} from 'lucide-react';

export const OwnerAuthPage = () => {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'create'
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Create Account State
  const [fullName, setFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // System Owner Status State
  const [ownerExists, setOwnerExists] = useState(null); // null = loading, true, false
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [ownerStatusError, setOwnerStatusError] = useState('');

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { ownerLogin, ownerSetup, isAuthenticated, isOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in as Owner
  useEffect(() => {
    if (isAuthenticated && isOwner) {
      const destination = location.state?.from?.pathname || '/owner/dashboard';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isOwner, navigate, location.state]);

  // Check whether an Owner account already exists on the backend
  const fetchOwnerStatus = async () => {
    setCheckingOwner(true);
    setOwnerStatusError('');
    try {
      const res = await authApi.getOwnerStatus();
      const exists = Boolean(res?.ownerExists);
      setOwnerExists(exists);
      // If no owner exists, immediately direct to the Create Account tab for first-time onboarding
      if (!exists) {
        setActiveTab('create');
      } else {
        setActiveTab('signin');
      }
    } catch (err) {
      console.warn('Could not check owner status:', err.message);
      setOwnerStatusError('Database connection error: ' + (err.message || 'Unable to reach the MySQL database server.'));
    } finally {
      setCheckingOwner(false);
    }
  };

  useEffect(() => {
    fetchOwnerStatus();
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, text: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score: 2, text: 'Medium', color: '#f59e0b' };
    return { score: 3, text: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(createPassword);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');

    if (!signInEmail.trim()) {
      setSignInError('Please enter your Owner email address.');
      return;
    }

    if (!signInPassword) {
      setSignInError('Please enter your account password.');
      return;
    }

    setSignInLoading(true);
    try {
      await ownerLogin(signInEmail.trim(), signInPassword, rememberMe);
      const destination = location.state?.from?.pathname || '/owner/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setSignInError(err.message || 'Invalid Owner credentials. Please try again.');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (ownerExists) {
      setCreateError('An Owner account has already been configured. Only one Owner is permitted. Please sign in.');
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setCreateError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!createEmail.trim() || !emailRegex.test(createEmail.trim())) {
      setCreateError('Please enter a valid email address.');
      return;
    }

    if (!createPassword || createPassword.length < 6) {
      setCreateError('Password must be at least 6 characters long.');
      return;
    }

    if (createPassword !== confirmPassword) {
      setCreateError('Passwords do not match. Please verify your entries.');
      return;
    }

    setCreateLoading(true);
    try {
      await ownerSetup(fullName.trim(), createEmail.trim(), createPassword, confirmPassword);
      setCreateSuccess('Owner account created successfully! Redirecting to CanteenFlow Owner Dashboard...');
      setOwnerExists(true);
      setTimeout(() => {
        navigate('/owner/dashboard', { replace: true });
      }, 1200);
    } catch (err) {
      setCreateError(err.message || 'Failed to create Owner account. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper" style={{ minHeight: 'calc(100vh - 75px)' }}>
      {/* =================================================================== */}
      {/* LEFT PANE: Premium Canteen & Operations Atmosphere */}
      {/* =================================================================== */}
      <div className="auth-split-visual" style={{ background: 'linear-gradient(135deg, #174C3C 0%, #0F3529 100%)' }}>
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&auto=format&fit=crop&q=85"
          alt="Modern Canteen Kitchen Atmosphere"
          style={{ opacity: 0.28 }}
        />

        {/* Top Header Branding */}
        <div className="auth-split-content">
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fff',
              fontSize: '1.45rem',
              fontWeight: 800,
              textDecoration: 'none'
            }}
          >
            <div
              style={{
                background: 'var(--warm-orange)',
                color: 'var(--forest-green)',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(244, 163, 64, 0.4)'
              }}
            >
              <ChefHat size={24} />
            </div>
            <span>
              Canteen<span style={{ color: 'var(--warm-orange)' }}>Flow</span>
            </span>
          </Link>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(244, 163, 64, 0.15)',
              border: '1px solid rgba(244, 163, 64, 0.35)',
              color: 'var(--warm-orange)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: '1.25rem'
            }}
          >
            <ShieldCheck size={14} /> Owner Administrative Portal
          </div>
        </div>

        {/* Center / Operational Value Highlights */}
        <div className="auth-split-content" style={{ margin: 'auto 0' }}>
          <h2
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#FFFFFF',
              marginBottom: '1rem',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Centralized Command for Your Campus Kitchen.
          </h2>
          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '460px',
              marginBottom: '2rem'
            }}
          >
            Manage dynamic menus, verify real-time counter & UPI payments, generate sequential tokens, and oversee daily sales reports in one unified cockpit.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '500px' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                padding: '1rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <div style={{ color: 'var(--warm-orange)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                ⚡ Live Tokens
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Real-time queue tracking from Placed to Collected.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                padding: '1rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <div style={{ color: 'var(--warm-orange)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                💳 Manual Payments
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Verify UPI reference IDs & counter cash payments.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                padding: '1rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <div style={{ color: 'var(--warm-orange)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                📋 Instant Menus
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Toggle item availability and adjust live prices.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                padding: '1rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <div style={{ color: 'var(--warm-orange)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                📊 Paid Receipts
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Automated official PDF receipts & revenue totals.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="auth-split-content" style={{ marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.65)'
            }}
          >
            <ShieldCheck size={16} color="var(--fresh-green-light)" />
            <span>Strict Role-Based Access Control · Single Master Owner Policy</span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* RIGHT PANE: Modern Combined Auth Form (Sign In & Create Account) */}
      {/* =================================================================== */}
      <div className="auth-split-form-pane" style={{ backgroundColor: 'var(--bg-cream)', padding: '2.5rem 1.5rem' }}>
        <div
          className="auth-form-card"
          style={{
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 2.25rem',
            border: '1px solid var(--border-light)',
            boxShadow: '0 12px 35px rgba(23, 76, 60, 0.07)'
          }}
        >
          {/* Top Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(38, 118, 83, 0.1)',
                color: 'var(--forest-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              <Store size={26} />
            </div>

            <h1
              style={{
                fontSize: '1.75rem',
                color: 'var(--forest-green)',
                fontWeight: 800,
                margin: '0 0 0.4rem',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Welcome to CanteenFlow
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
              Manage your menu, track live orders, and keep your canteen running smoothly.
            </p>
          </div>

          {/* Checking Setup Status Loader */}
          {checkingOwner ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={30} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--forest-green)', display: 'block' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--forest-green)' }}>
                Connecting to Canteen Database...
              </div>
              <div style={{ fontSize: '0.84rem', marginTop: '0.3rem' }}>
                Verifying single Owner configuration from MySQL
              </div>
            </div>
          ) : ownerStatusError ? (
            /* Database Connectivity Error Panel */
            <div
              style={{
                padding: '1.75rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                textAlign: 'center',
                margin: '1rem 0'
              }}
            >
              <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ color: '#991b1b', margin: '0 0 0.4rem', fontWeight: 800, fontSize: '1.1rem' }}>
                Database Connection Error
              </h4>
              <p style={{ color: '#b91c1c', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                {ownerStatusError}
              </p>
              <button
                type="button"
                onClick={fetchOwnerStatus}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem', margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} />
                <span>Retry Database Connection</span>
              </button>
            </div>
          ) : (
            <>
              {/* Tab Switcher: Sign In vs Create Account */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--bg-cream)',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  marginBottom: '1.75rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setSignInError('');
                  }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                background: activeTab === 'signin' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'signin' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: activeTab === 'signin' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none'
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setCreateError('');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                position: 'relative',
                background: activeTab === 'create' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'create' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: activeTab === 'create' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none'
              }}
            >
              Create Account
              {ownerExists && (
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '10px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#94a3b8'
                  }}
                  title="Single Owner already configured"
                />
              )}
            </button>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: OWNER SIGN IN FORM */}
          {/* ================================================================= */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn}>
              <AlertMessage type="error" message={signInError} />

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="owner-email">
                  Owner Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-light)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    id="owner-email"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="e.g. owner@canteen.edu"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" htmlFor="owner-password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-light)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    id="owner-password"
                    type={showSignInPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="Enter your Owner password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    tabIndex="-1"
                    title={showSignInPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-dark)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--forest-green)', width: '15px', height: '15px' }}
                  />
                  <span>Remember me (30 days)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--fresh-green)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textDecoration: 'none'
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={signInLoading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {signInLoading ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Switch to first-time setup prompt if no owner exists */}
              {ownerExists === false && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', marginBottom: '0.2rem' }}>
                    👋 First-Time Canteen Setup Available
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#b45309', marginBottom: '0.5rem' }}>
                    No Owner account has been created yet. You can provision your master account now.
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--forest-green)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Switch to Create Owner Account →
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ================================================================= */}
          {/* TAB 2: OWNER CREATE ACCOUNT FORM (ENFORCES EXACTLY ONE OWNER) */}
          {/* ================================================================= */}
          {activeTab === 'create' && (
            <div>
              {/* If an Owner account is already configured in MySQL */}
              {ownerExists === true ? (
                <div
                  style={{
                    background: 'var(--bg-cream)',
                    border: '1.5px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.75rem 1.25rem',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#fef3c7',
                      color: '#b45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem'
                    }}
                  >
                    <Lock size={22} />
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', fontWeight: 800, margin: '0 0 0.5rem' }}>
                    Owner Account Already Configured
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                    Security Policy: Exactly <strong>ONE</strong> master Owner account is permitted for this canteen application. New registrations are locked.
                  </p>

                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.82rem',
                      color: 'var(--text-dark)',
                      marginBottom: '1.25rem',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--forest-green)', marginBottom: '0.2rem' }}>
                      Need to access the canteen?
                    </div>
                    <div>• Please sign in with your established Owner credentials.</div>
                    <div>• To reset forgotten credentials, use the backend CLI tool.</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem' }}
                  >
                    Proceed to Owner Sign In
                  </button>
                </div>
              ) : (
                /* Initial First-Time Setup Form (When 0 Owners exist) */
                <form onSubmit={handleCreateAccount}>
                  <AlertMessage type="error" message={createError} />
                  <AlertMessage type="success" message={createSuccess} />

                  <div
                    style={{
                      background: 'rgba(38, 118, 83, 0.08)',
                      border: '1px solid rgba(38, 118, 83, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}
                  >
                    <Sparkles size={20} color="var(--fresh-green)" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: 'var(--forest-green)', lineHeight: 1.4 }}>
                      <strong>First-Time Setup:</strong> You are creating the single, authoritative master Owner account for this canteen.
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="create-owner-name">
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-light)',
                          pointerEvents: 'none'
                        }}
                      />
                      <input
                        id="create-owner-name"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.75rem' }}
                        placeholder="e.g. Ramesh Kumar"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="create-owner-email">
                      Official Owner Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-light)',
                          pointerEvents: 'none'
                        }}
                      />
                      <input
                        id="create-owner-email"
                        type="email"
                        className="form-input"
                        style={{ paddingLeft: '2.75rem' }}
                        placeholder="e.g. owner@canteen.edu"
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="create-owner-password">
                      Master Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-light)',
                          pointerEvents: 'none'
                        }}
                      />
                      <input
                        id="create-owner-password"
                        type={showCreatePassword ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                        placeholder="Minimum 6 characters"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        style={{
                          position: 'absolute',
                          right: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        tabIndex="-1"
                      >
                        {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {createPassword && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                          <span style={{ fontWeight: 700, color: passwordStrength.color }}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div style={{ height: '4px', width: '100%', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${(passwordStrength.score / 3) * 100}%`,
                              background: passwordStrength.color,
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label" htmlFor="create-owner-confirm">
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-light)',
                          pointerEvents: 'none'
                        }}
                      />
                      <input
                        id="create-owner-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                        placeholder="Re-enter master password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {confirmPassword && (
                      <div style={{ fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {createPassword === confirmPassword ? (
                          <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> Passwords match perfectly
                          </span>
                        ) : (
                          <span style={{ color: '#b91c1c' }}>Passwords do not match</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createLoading}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.98rem',
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {createLoading ? (
                      <>
                        <RefreshCw size={18} className="spin" />
                        <span>Provisioning Owner Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Master Owner Account</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}

          {/* Switch to Student Portal Footer Link */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-light)',
              textAlign: 'center',
              fontSize: '0.88rem',
              color: 'var(--text-muted)'
            }}
          >
            <span>Are you a student ordering meals? </span>
            <Link
              to="/login"
              style={{
                color: 'var(--fresh-green)',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Go to Student Portal →
            </Link>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* FORGOT PASSWORD MODAL (EXPLAINS SECURE BACKEND CLI RESET) */}
      {/* =================================================================== */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)} style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.5rem', borderRadius: '10px' }}>
                  <Terminal size={22} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)', margin: 0, fontWeight: 800 }}>
                  Owner Password Recovery
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-dark)', lineHeight: 1.6, marginBottom: '1rem' }}>
              For institutional security, the master Canteen Owner credentials cannot be reset via unverified public emails.
            </p>

            <div
              style={{
                background: 'var(--bg-cream)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest-green)', marginBottom: '0.4rem' }}>
                SECURE CLI RESET INSTRUCTIONS:
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', margin: '0 0 0.5rem' }}>
                Run the official Owner configuration utility in your backend directory:
              </p>
              <pre
                style={{
                  background: '#1e293b',
                  color: '#38bdf8',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  margin: 0
                }}
              >
                cd backend{'\n'}npm run seed:owner
              </pre>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                The script will recognize your existing Owner account and prompt you to set a new password.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowForgotModal(false)}
                className="btn btn-primary"
                style={{ fontSize: '0.88rem', padding: '0.5rem 1.25rem' }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerAuthPage;
