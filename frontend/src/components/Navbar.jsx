import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Utensils, LogOut, LayoutDashboard, LogIn, UserPlus, ShoppingBag, Ticket, ShieldCheck } from 'lucide-react';
import NotificationBell from './NotificationBell';

export const Navbar = () => {
  const { user, isAuthenticated, isOwner, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container nav-wrapper">
        {/* Brand */}
        <Link to="/" className="brand" id="nav-brand">
          <div className="brand-icon">
            <Utensils size={20} />
          </div>
          <span>
            Campus<span style={{ color: 'var(--warm-orange)' }}>Bite</span>
          </span>
        </Link>

        {/* Center / Navigation Links */}
        <ul className="nav-links">
          <li>
            <Link to="/" className="nav-link" id="nav-home">
              Home
            </Link>
          </li>
          <li>
            <Link to="/student/dashboard" className="nav-link" id="nav-menu">
              Daily Menu
            </Link>
          </li>

          {isAuthenticated && (
            <li>
              <Link
                to={isOwner ? '/owner/dashboard' : '/student/dashboard'}
                className="nav-link"
                id="nav-dashboard"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {isOwner ? <LayoutDashboard size={16} /> : <Ticket size={16} />}
                <span>{isOwner ? 'Owner Dashboard' : 'My Orders & Tokens'}</span>
              </Link>
            </li>
          )}
        </ul>

        {/* Right Actions: Cart, Notifications & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* In-App Notifications */}
          <NotificationBell />

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="nav-cart-btn"
            id="nav-cart-toggle"
            aria-label="Open Canteen Tray"
          >
            <ShoppingBag size={18} />
            <span>Tray</span>
            {totalItems > 0 && <span className="cart-count-badge">{totalItems}</span>}
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid var(--forest-green)'
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--forest-green)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  >
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className={`badge ${isOwner ? 'badge-admin' : 'badge-student'}`}>
                  {isOwner ? 'OWNER' : 'STUDENT'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                id="nav-logout-btn"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                title="Sign out of account"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link
                to="/owner/auth"
                className="nav-link"
                id="nav-owner-portal"
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--forest-green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 700,
                  marginRight: '0.25rem'
                }}
              >
                <ShieldCheck size={16} color="var(--fresh-green)" />
                <span>Owner Portal</span>
              </Link>
              <Link to="/login" className="btn btn-secondary" id="nav-login-btn" style={{ padding: '0.55rem 1rem', fontSize: '0.88rem' }}>
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-primary" id="nav-register-btn" style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}>
                <UserPlus size={15} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
