import { Utensils, Heart, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)', marginTop: '5rem', padding: '3.5rem 0 2rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          {/* Brand info */}
          <div>
            <div className="brand" style={{ marginBottom: '1rem' }}>
              <div className="brand-icon">
                <Utensils size={18} />
              </div>
              <span>
                Campus<span style={{ color: 'var(--warm-orange)' }}>Bite</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Cloud-powered college canteen pre-ordering. Skip peak lunch hour lines and collect fresh campus meals with your digital token.
            </p>
          </div>

          {/* Canteen Timings */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--forest-green)', marginBottom: '1rem' }}>Canteen Operating Hours</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={15} color="var(--fresh-green)" />
                <span>Mon – Fri: <strong>8:00 AM – 7:30 PM</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={15} color="var(--fresh-green)" />
                <span>Saturday: <strong>8:30 AM – 4:00 PM</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={15} color="var(--warm-orange)" />
                <span>Campus Student Center, Ground Floor</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--forest-green)', marginBottom: '1rem' }}>Quick Navigation</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/" style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }}>Home</Link>
              </li>
              <li>
                <Link to="/student/dashboard" style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }}>Browse Daily Menu</Link>
              </li>
              <li>
                <Link to="/login" style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }}>Student / Staff Login</Link>
              </li>
              <li>
                <Link to="/register" style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }}>Create Account</Link>
              </li>
            </ul>
          </div>

          {/* Trust badge */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--forest-green)', marginBottom: '1rem' }}>Token Management</h4>
            <div style={{ padding: '1rem', background: 'var(--bg-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--forest-green)', fontSize: '0.88rem', marginBottom: '0.3rem' }}>
                <ShieldCheck size={18} color="var(--fresh-green)" />
                <span>Zero Physical Queue</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Orders are queued directly to kitchen counter displays. Pick up when your digital token turns green.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div>© {new Date().getFullYear()} CampusBite System. College Canteen Pre-Order & Token Platform.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Crafted with</span>
            <Heart size={14} color="#ef4444" fill="#ef4444" />
            <span>for seamless student breaks</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
