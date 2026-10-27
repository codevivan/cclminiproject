import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';
import { UserPlus, ArrowRight, Utensils, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    const roleUpper = String(user.role || '').toUpperCase();
    const destination = (roleUpper === 'OWNER' || roleUpper === 'ADMIN') ? '/owner/dashboard' : '/student/dashboard';
    navigate(destination, { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please provide a valid college email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to create student account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Pane: Photography & Features */}
      <div className="auth-split-visual">
        <img
          src="https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1200&auto=format&fit=crop&q=80"
          alt="Fresh campus cooking"
        />

        <div className="auth-split-content">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>
            <div style={{ background: 'var(--warm-orange)', color: 'var(--forest-green-dark)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={20} />
            </div>
            <span>Campus<span style={{ color: 'var(--warm-orange)' }}>Bite</span></span>
          </Link>
        </div>

        <div className="auth-split-content" style={{ marginTop: 'auto' }}>
          <div style={{ background: 'rgba(15, 53, 41, 0.75)', backdropFilter: 'blur(10px)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warm-orange)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem' }}>
              <Sparkles size={16} /> Instant Student Account
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--warm-orange)" />
                <span>Pre-order meals from classroom or hostel</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--warm-orange)" />
                <span>Real-time digital token callouts on your phone</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--warm-orange)" />
                <span>Express pickup bays with zero queueing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Registration Form */}
      <div className="auth-split-form-pane">
        <div className="auth-form-card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--forest-green)', marginBottom: '0.35rem' }}>
              Student Registration
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Sign up to pre-order food and bypass canteen queues.
            </p>
          </div>

          <AlertMessage type="error" message={error} />

          {/* Google One-Click Registration */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-google"
            id="btn-google-register"
            style={{ padding: '0.75rem 1rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign up with Google</span>
          </button>

          <div className="auth-divider">
            <span>or register with college email</span>
          </div>

          <form onSubmit={handleSubmit} id="register-form">
            <div className="form-group">
              <label className="form-label" htmlFor="register-name">
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                className="form-input"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-email">
                Campus Email
              </label>
              <input
                id="register-email"
                type="email"
                className="form-input"
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={submitting}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="register-password">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  className="form-input"
                  placeholder="min. 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-confirm">
                  Confirm
                </label>
                <input
                  id="register-confirm"
                  type="password"
                  className="form-input"
                  placeholder="re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="register-submit-btn"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--forest-green)', fontWeight: 700 }} id="link-to-login">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
