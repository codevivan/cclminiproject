import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AccessDeniedPage = ({ requiredRole = 'ADMIN' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getTargetDashboard = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    return '/student/dashboard';
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--cream-bg, #FAF8F2)'
    }}>
      <div style={{
        maxWidth: '540px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: '0 10px 30px rgba(23, 76, 60, 0.08)',
        border: '1px solid rgba(23, 76, 60, 0.08)',
        textAlign: 'center'
      }}>
        {/* Shield Icon Badge */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          color: '#DC2626'
        }}>
          <ShieldAlert size={42} strokeWidth={2.2} />
        </div>

        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          background: 'rgba(244, 163, 64, 0.15)',
          color: '#B45309',
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '1px',
          borderRadius: '999px',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          HTTP 403 · Access Restricted
        </span>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: 'var(--text-dark, #202923)',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          Access Denied
        </h1>

        <p style={{
          fontSize: '0.975rem',
          color: 'var(--text-muted, #777F78)',
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          You do not have the required permissions to view this page. This area requires an authorized{' '}
          <strong style={{ color: '#174C3C' }}>{requiredRole.toUpperCase()}</strong> role.
        </p>

        {user && (
          <div style={{
            background: 'var(--cream-bg, #FAF8F2)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '28px',
            fontSize: '0.85rem',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(23, 76, 60, 0.06)'
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#202923' }}>{user.name}</div>
              <div style={{ color: '#777F78', fontSize: '0.8rem' }}>{user.email}</div>
            </div>
            <span style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: user.role === 'admin' ? '#174C3C' : '#267653',
              color: '#FFFFFF'
            }}>
              Current Role: {user.role}
            </span>
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Link
            to={getTargetDashboard()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--forest-green, #174C3C)',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.2s ease',
              boxShadow: '0 4px 12px rgba(23, 76, 60, 0.2)'
            }}
          >
            <Home size={18} /> Return to Your {user?.role === 'admin' ? 'Admin' : 'Student'} Dashboard
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 20px',
              background: 'transparent',
              color: 'var(--text-muted, #777F78)',
              border: '1px solid rgba(119, 127, 120, 0.3)',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={16} /> Switch Account / Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
