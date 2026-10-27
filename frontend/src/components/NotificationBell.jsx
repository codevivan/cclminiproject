import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Utensils,
  Check,
  CheckCheck,
  Info,
  X
} from 'lucide-react';
import { notificationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // Silently catch in polling
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // 15s poll
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Could not mark notification read:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Could not mark all read:', err.message);
    }
  };

  if (!isAuthenticated) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment_confirmed':
        return <CheckCircle2 size={16} color="#16a34a" />;
      case 'payment_review':
        return <Clock size={16} color="#d97706" />;
      case 'preparing':
        return <Utensils size={16} color="#0284c7" />;
      case 'ready':
        return <CheckCircle2 size={16} color="#267653" />;
      case 'completed':
        return <Check size={16} color="#64748b" />;
      default:
        return <ShoppingBag size={16} color="var(--forest-green)" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? 'var(--bg-cream)' : 'transparent',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-full)',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          color: 'var(--forest-green)',
          transition: 'all 0.2s ease'
        }}
        aria-label="View notifications"
        title="In-app notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#dc2626',
              color: '#FFFFFF',
              fontSize: '0.7rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 5px rgba(220, 38, 38, 0.4)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            background: '#FFFFFF',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 35px rgba(23, 76, 60, 0.15)',
            zIndex: 1200,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-cream)',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--forest-green)', fontSize: '0.95rem' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--warm-orange)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px'
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.35 }} />
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>No notifications yet</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem' }}>
                  Updates on your orders and payments will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid var(--border-light)',
                    background: notif.is_read ? '#FFFFFF' : 'rgba(23, 76, 60, 0.03)',
                    cursor: notif.is_read ? 'default' : 'pointer',
                    transition: 'background 0.2s ease',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--bg-cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {getTypeIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                      <div
                        style={{
                          fontWeight: notif.is_read ? 600 : 700,
                          fontSize: '0.85rem',
                          color: notif.is_read ? 'var(--text-dark)' : 'var(--forest-green)'
                        }}
                      >
                        {notif.title}
                      </div>
                      {!notif.is_read && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: 'var(--warm-orange)',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
                      {new Date(notif.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' · '}
                      {new Date(notif.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
