import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { menuApi } from '../services/api';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Ticket,
  ChefHat,
  ShoppingBag,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Smartphone,
  Plus
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const [featuredDishes, setFeaturedDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        const response = await menuApi.getAll({ availableOnly: true });
        if (isMounted && response?.data) {
          // Take top 4 featured items
          const featured = response.data.filter((item) => item.is_featured).slice(0, 4);
          setFeaturedDishes(featured.length > 0 ? featured : response.data.slice(0, 4));
        }
      } catch (err) {
        console.warn('Could not load featured dishes from API:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickAdd = (dish, e) => {
    e.preventDefault();
    addToCart(dish, 1);
    setIsCartOpen(true);
  };

  return (
    <div>
      {/* 1. Large Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <div className="hero-tag">
              <Sparkles size={16} />
              <span>Smart College Canteen Pre-Ordering</span>
            </div>

            <h1 className="hero-title">
              Your Campus Cravings, <br />
              <span className="highlight">Without the Queue.</span>
            </h1>

            <p className="hero-desc">
              Browse today's canteen menu, pre-order in seconds, and grab your meal right when your digital token turns green. No crowded counters or wasted break time.
            </p>

            <div className="hero-actions">
              <Link
                to={isAuthenticated && user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="btn btn-orange"
                id="hero-order-now-btn"
                style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
              >
                <span>Order Now</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/student/dashboard"
                className="btn btn-secondary"
                id="hero-browse-menu-btn"
                style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
              >
                <ChefHat size={18} />
                <span>Explore Daily Menu</span>
              </Link>
            </div>

            {/* Quick highlights */}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)' }}>
              <div>
                <h4 style={{ fontSize: '1.6rem', color: 'var(--forest-green)', margin: 0 }}>~6 mins</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Average Pickup Time</p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.6rem', color: 'var(--forest-green)', margin: 0 }}>100%</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Digital Token Tracking</p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.6rem', color: 'var(--forest-green)', margin: 0 }}>Zero</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Waiting at the Counter</p>
              </div>
            </div>
          </div>

          {/* Hero Photography & Live Token Card */}
          <div className="hero-image-card">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&auto=format&fit=crop&q=80"
              alt="Fresh campus gourmet meal"
            />
            {/* Live Token Overlay */}
            <div className="hero-floating-token">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--warm-orange-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--forest-green-dark)'
                  }}
                >
                  <Ticket size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--forest-green)' }}>#T-104</span>
                    <span className="badge badge-status-ready">Ready for Pickup</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Paneer Tikka Bowl • Bay #1 (Hot Meals)
                  </p>
                </div>
              </div>
              <CheckCircle2 color="var(--fresh-green)" size={26} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three-Step Explanation */}
      <section className="steps-section">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Three effortless steps between your craving and hot, fresh food.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)' }}>Browse Today's Menu</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Open CampusBite on your phone from lecture or library. Check real-time dish availability and prep times.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)' }}>Place Pre-Order</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Add items to your tray with special kitchen notes. Submit your order and immediately receive your digital token.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)' }}>Collect with Token</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Watch the live kitchen status. When your token turns green, head straight to the designated counter for express pickup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Dishes Section */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-student" style={{ marginBottom: '0.5rem' }}>
                Chef's Recommendations
              </span>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--forest-green)' }}>Today's Campus Specialties</h2>
              <p style={{ color: 'var(--text-muted)' }}>Prepared fresh with high quality ingredients by our kitchen crew.</p>
            </div>

            <Link to="/student/dashboard" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
              <span>View Full Menu</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="food-grid">
            {loading ? (
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="food-card" style={{ height: '340px' }}>
                  <div className="skeleton" style={{ height: '180px' }}></div>
                  <div style={{ padding: '1.25rem' }}>
                    <div className="skeleton" style={{ height: '20px', width: '70%', marginBottom: '0.75rem' }}></div>
                    <div className="skeleton" style={{ height: '14px', width: '90%', marginBottom: '0.5rem' }}></div>
                    <div className="skeleton" style={{ height: '14px', width: '50%' }}></div>
                  </div>
                </div>
              ))
            ) : (
              featuredDishes.map((dish) => (
                <div key={dish.id} className="food-card">
                  <div className="food-card-img-wrapper">
                    <img
                      src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                      alt={dish.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="food-card-prep-tag">
                      <Clock size={13} />
                      <span>{dish.prep_time_minutes || 8} mins</span>
                    </div>
                  </div>

                  <div className="food-card-body">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fresh-green)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                      {dish.category}
                    </span>
                    <h3 className="food-card-title">{dish.name}</h3>
                    <p className="food-card-desc">{dish.description}</p>

                    <div className="food-card-footer">
                      <div className="food-card-price">₹{dish.price}</div>
                      <button
                        onClick={(e) => handleQuickAdd(dish, e)}
                        className="btn btn-primary"
                        style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                        id={`btn-quick-add-${dish.id}`}
                      >
                        <Plus size={15} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. Benefits Section */}
      <section style={{ padding: '4.5rem 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Designed for Busy Students & Staff</h2>
            <p>Everything you need for rapid, stress-free lunch and snack breaks.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-cream)', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--fresh-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fresh-green)', marginBottom: '1.25rem' }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', marginBottom: '0.5rem' }}>Guaranteed Zero Lines</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Order from class 10 minutes before break. Arrive at the canteen when your food is ready and walk away in 30 seconds.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-cream)', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--warm-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b46b14', marginBottom: '1.25rem' }}>
                <Ticket size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', marginBottom: '0.5rem' }}>Live Token Tracking</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Clear 4-stage visual progress: Received → In Kitchen → Ready for Pickup → Collected. Never guess where your order is.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-cream)', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--fresh-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fresh-green)', marginBottom: '1.25rem' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--forest-green)', marginBottom: '0.5rem' }}>Secure & Accurate</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every item is confirmed against live kitchen inventory with token authentication. No lost paper slips or mix-ups.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
