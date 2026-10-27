import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';
import { LogIn, ArrowRight, Utensils, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [location.search]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleUpper = String(user.role || '').toUpperCase();
      const isOwnerUser = roleUpper === 'OWNER' || roleUpper === 'ADMIN';
      const destination =
        location.state?.from?.pathname ||
        (isOwnerUser ? '/owner/dashboard' : '/student/dashboard');
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await login(email, password);
      const roleUpper = String(response.user.role || '').toUpperCase();
      const isOwnerUser = roleUpper === 'OWNER' || roleUpper === 'ADMIN';
      const destination =
        location.state?.from?.pathname ||
        (isOwnerUser ? '/owner/dashboard' : '/student/dashboard');
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Pane: Photography & Campus Lifestyle */}
      <div className="auth-split-visual">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80"
          alt="Artisanal food atmosphere"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warm-orange)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              <Sparkles size={16} /> Fast Digital Token Pickup
            </div>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.95)', margin: 0 }}>
              "CampusBite changed our lunch breaks completely. We order from class, walk down when the token is ready, and eat hot food without waiting 20 minutes."
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              — Engineering & Management Campus Students
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Login Form */}
      <div className="auth-split-form-pane">
        <div className="auth-form-card">
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--forest-green)', marginBottom: '0.35rem' }}>
              Welcome Back
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Sign in to pre-order food and manage your tokens.
            </p>
          </div>

          <AlertMessage type="error" message={error} />

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-google"
            id="btn-google-login"
            style={{ padding: '0.75rem 1rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Campus Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="student@campus.edu or admin@canteen.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
              </div>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="login-submit-btn"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            New to CampusBite?{' '}
            <Link to="/register" style={{ color: 'var(--forest-green)', fontWeight: 700 }} id="link-to-register">
              Create student account
            </Link>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            Are you a Canteen Staff or Owner?{' '}
            <Link to="/owner/auth" style={{ color: 'var(--fresh-green)', fontWeight: 700 }} id="link-to-owner-auth">
              Owner Sign In & Setup →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
