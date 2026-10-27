import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { menuApi, orderApi, canteenApi } from '../services/api';
import {
  Search,
  Clock,
  Plus,
  Minus,
  ShoppingBag,
  Ticket,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Filter,
  RefreshCw,
  Utensils,
  FileText,
  PauseCircle,
  Store
} from 'lucide-react';
import OrderTrackingModal from '../components/OrderTrackingModal';
import AlertMessage from '../components/AlertMessage';

const CATEGORIES = ['All', 'Meals', 'Snacks', 'Beverages', 'Desserts'];

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { cartItems, addToCart, updateQuantity, setIsCartOpen } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState('');

  // Today's Canteen Operating Status & Notice
  const [canteenStatus, setCanteenStatus] = useState({
    status: 'open',
    notice: 'Welcome! Online food pre-orders are open today.',
    opening_time: '08:00',
    closing_time: '20:00'
  });

  // Active / recent orders
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState(null);

  // Active tab: 'menu' or 'tokens'
  const [activeTab, setActiveTab] = useState('menu');

  // Load Canteen Operating Status
  const fetchCanteenStatus = async () => {
    try {
      const res = await canteenApi.getStatus();
      if (res?.status) setCanteenStatus(res.status);
    } catch (e) {
      console.warn('Could not load canteen operating status:', e.message);
    }
  };

  // Load Menu items
  const fetchMenu = async () => {
    setLoadingMenu(true);
    setMenuError('');
    try {
      const response = await menuApi.getAll({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined
      });
      setMenuItems(response.data || []);
    } catch (err) {
      setMenuError(err.message || 'Failed to load canteen menu.');
    } finally {
      setLoadingMenu(false);
    }
  };

  // Load My Orders
  const fetchMyOrders = async (showLoader = false) => {
    if (showLoader && myOrders.length === 0) setLoadingOrders(true);
    try {
      const response = await orderApi.getMyOrders();
      setMyOrders(response.orders || []);
      // If modal is tracking an order, update its reference
      if (trackingOrder) {
        const updated = (response.orders || []).find((o) => o.id === trackingOrder.id);
        if (updated) setTrackingOrder(updated);
      }
    } catch (err) {
      console.warn('Could not load student orders:', err.message);
    } finally {
      if (showLoader) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchCanteenStatus();
    fetchMenu();
  }, [selectedCategory]);

  useEffect(() => {
    fetchMyOrders(true);
    fetchCanteenStatus();
    // Poll active orders and canteen status every 4 seconds so token updates synchronize live!
    const interval = setInterval(() => {
      fetchMyOrders(false);
      fetchCanteenStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMenu();
  };

  // Find active order (pending, confirmed, preparing, or ready)
  const activeOrder = myOrders.find((o) =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status?.toLowerCase())
  );

  const getItemQuantityInCart = (itemId) => {
    const item = cartItems.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Welcome & Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--forest-green)', margin: 0 }}>
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <span className="badge badge-student">Student</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Select your favorite canteen dishes and pre-order for fast counter pickup.
          </p>
        </div>

        {/* Tab switcher: Menu vs My Tokens */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <button
            onClick={() => setActiveTab('menu')}
            className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem', border: 'none' }}
          >
            <Utensils size={16} />
            <span>Campus Menu</span>
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`btn ${activeTab === 'tokens' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem', border: 'none', position: 'relative' }}
          >
            <Ticket size={16} />
            <span>My Tokens</span>
            {activeOrder && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--warm-orange)',
                  marginLeft: '0.2rem'
                }}
              ></span>
            )}
          </button>
        </div>
      </div>

      {/* Today's Canteen Operating Status Banner */}
      {canteenStatus.status === 'paused' ? (
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <PauseCircle size={26} color="#d97706" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1.02rem' }}>
              ⚠️ Online Ordering is Temporarily Paused
            </div>
            <div style={{ color: '#b45309', fontSize: '0.88rem', marginTop: '0.15rem' }}>
              {canteenStatus.notice || 'The kitchen is currently handling heavy demand. Pre-ordering will resume shortly.'}
            </div>
          </div>
        </div>
      ) : canteenStatus.status === 'closed' ? (
        <div
          style={{
            background: '#fef2f2',
            border: '1.5px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <Store size={26} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '1.02rem' }}>
              ⛔ Canteen is Closed for Today
            </div>
            <div style={{ color: '#b91c1c', fontSize: '0.88rem', marginTop: '0.15rem' }}>
              {canteenStatus.notice || `Daily operating hours: ${canteenStatus.opening_time || '08:00'} to ${canteenStatus.closing_time || '20:00'}. New orders cannot be placed at this time.`}
            </div>
          </div>
        </div>
      ) : canteenStatus.status === 'closing_soon' ? (
        <div
          style={{
            background: '#fff7ed',
            border: '1.5px solid #fed7aa',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <Clock size={24} color="#ea580c" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, color: '#9a3412', fontSize: '1.02rem' }}>
              ⏰ Closing Soon · Order Cutoff at {canteenStatus.closing_time || '20:00'}
            </div>
            <div style={{ color: '#c2410c', fontSize: '0.88rem', marginTop: '0.15rem' }}>
              {canteenStatus.notice || 'Please place your orders promptly before the kitchen cutoff.'}
            </div>
          </div>
        </div>
      ) : canteenStatus.notice ? (
        <div
          style={{
            background: 'rgba(38, 118, 83, 0.08)',
            border: '1.5px solid rgba(38, 118, 83, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Store size={20} color="var(--fresh-green)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.88rem', color: 'var(--forest-green)', fontWeight: 600 }}>
            <span style={{ fontWeight: 800 }}>Canteen Open ({canteenStatus.opening_time || '08:00'} - {canteenStatus.closing_time || '20:00'}):</span> {canteenStatus.notice}
          </div>
        </div>
      ) : null}

      {/* Active Token Persistent Callout Banner */}
      {activeOrder && (
        <div
          className="surface-card"
          style={{
            background: 'var(--forest-green)',
            color: '#fff',
            padding: '1.25rem 1.75rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            border: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--warm-orange)'
              }}
            >
              <Ticket size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Active Canteen Token
                </span>
                <span className={`badge badge-status-${activeOrder.status}`}>
                  {activeOrder.status}
                </span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warm-orange)' }}>
                #{activeOrder.token_number}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                Pickup: <strong>{activeOrder.pickup_counter || 'Main Bay'}</strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                {activeOrder.items?.length || 1} items • ₹{parseFloat(activeOrder.total_amount).toFixed(2)}
              </div>
            </div>

            <button
              onClick={() => setTrackingOrder(activeOrder)}
              className="btn btn-orange"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}
            >
              <span>Track Live Token</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: MENU & ORDERING */}
      {activeTab === 'menu' && (
        <>
          {/* Search & Category Filter Toolbar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <Search
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Search dishes (e.g. Dosa, Burger, Cold Brew, Hakka Noodles...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <button
                type="button"
                onClick={fetchMenu}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1.25rem' }}
                title="Search menu"
              >
                <span>Search</span>
              </button>
            </div>

            {/* Category tabs */}
            <div className="category-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <AlertMessage type="error" message={menuError} />

          {/* Food Grid */}
          {loadingMenu ? (
            <div className="food-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="food-card" style={{ height: '360px' }}>
                  <div className="skeleton" style={{ height: '190px' }}></div>
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton" style={{ height: '18px', width: '40%' }}></div>
                    <div className="skeleton" style={{ height: '22px', width: '80%' }}></div>
                    <div className="skeleton" style={{ height: '14px', width: '100%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--bg-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--text-muted)'
                }}
              >
                <Search size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)', marginBottom: '0.4rem' }}>
                No dishes found
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                We couldn't find any dishes matching "{searchQuery}". Try selecting another category or clearing your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="btn btn-secondary"
                style={{ marginTop: '1rem' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="food-grid">
              {menuItems.map((dish) => {
                const qtyInCart = getItemQuantityInCart(dish.id);
                const isSoldOut = !dish.is_available;
                const isCanteenBlocked = canteenStatus.status === 'paused' || canteenStatus.status === 'closed';

                return (
                  <div key={dish.id} className="food-card" style={{ opacity: isSoldOut ? 0.75 : 1 }}>
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

                      {isSoldOut ? (
                        <div
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            left: '0.75rem',
                            background: '#dc2626',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase'
                          }}
                        >
                          Sold Out
                        </div>
                      ) : null}

                      {dish.is_featured ? (
                        <div
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            background: 'var(--warm-orange)',
                            color: 'var(--forest-green-dark)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase'
                          }}
                        >
                          Special
                        </div>
                      ) : null}
                    </div>

                    <div className="food-card-body">
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--fresh-green)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: '0.2rem'
                        }}
                      >
                        {dish.category}
                      </span>
                      <h3 className="food-card-title">{dish.name}</h3>
                      <p className="food-card-desc">{dish.description}</p>

                      <div className="food-card-footer">
                        <div className="food-card-price">₹{dish.price}</div>

                        {isSoldOut ? (
                          <button
                            disabled
                            className="btn btn-secondary"
                            style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem', opacity: 0.6, cursor: 'not-allowed' }}
                          >
                            Sold Out
                          </button>
                        ) : isCanteenBlocked ? (
                          <button
                            disabled
                            className="btn btn-secondary"
                            style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem', opacity: 0.6, cursor: 'not-allowed' }}
                          >
                            {canteenStatus.status === 'paused' ? 'Paused' : 'Closed'}
                          </button>
                        ) : qtyInCart > 0 ? (
                          <div className="qty-control">
                            <button
                              className="qty-btn"
                              onClick={() => updateQuantity(dish.id, qtyInCart - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="qty-value">{qtyInCart}</span>
                            <button
                              className="qty-btn"
                              onClick={() => updateQuantity(dish.id, qtyInCart + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              addToCart(dish, 1);
                              setIsCartOpen(true);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                            id={`btn-add-dish-${dish.id}`}
                          >
                            <Plus size={15} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: MY ORDERS & TOKENS */}
      {activeTab === 'tokens' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--forest-green)', margin: 0 }}>
                My Canteen Orders & Token History
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Track your active digital tokens and past pre-orders.
              </p>
            </div>

            <button
              onClick={() => fetchMyOrders(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
            >
              <RefreshCw size={14} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {loadingOrders && myOrders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="surface-card skeleton" style={{ height: '90px' }}></div>
              ))}
            </div>
          ) : myOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--bg-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--text-muted)'
                }}
              >
                <Ticket size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--forest-green)', marginBottom: '0.4rem' }}>
                No pre-orders yet
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
                You haven't placed any canteen orders today. Browse the menu and place your first order.
              </p>
              <button onClick={() => setActiveTab('menu')} className="btn btn-primary">
                Browse Campus Menu
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myOrders.map((ord) => {
                const isActive = ['pending', 'preparing', 'ready'].includes(ord.status?.toLowerCase());
                return (
                  <div
                    key={ord.id}
                    className="surface-card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      borderLeft: isActive ? '4px solid var(--warm-orange)' : '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '12px',
                          background: isActive ? 'var(--forest-green)' : 'var(--bg-subtle)',
                          color: isActive ? 'var(--warm-orange)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1rem',
                          fontFamily: 'var(--font-heading)'
                        }}
                      >
                        #{ord.token_number}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--forest-green)' }}>
                            Token #{ord.token_number}
                          </span>
                          <span className={`badge badge-status-${ord.status?.toLowerCase()}`}>
                            {ord.status}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background:
                                ord.payment_status === 'PAID'
                                  ? '#dcfce7'
                                  : ord.payment_status === 'PENDING_VERIFICATION'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                ord.payment_status === 'PAID'
                                  ? '#15803d'
                                  : ord.payment_status === 'PENDING_VERIFICATION'
                                  ? '#b45309'
                                  : '#b91c1c'
                            }}
                          >
                            {ord.payment_status === 'PAID'
                              ? 'PAID'
                              : ord.payment_status === 'PENDING_VERIFICATION'
                              ? 'PAYMENT REVIEW'
                              : 'UNPAID (COUNTER)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {(ord.items || []).map((it) => `${it.quantity}x ${it.item_name}`).join(', ') || 'Canteen meal'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                          Method: <strong>{ord.payment_method || 'Cash'}</strong>
                          {ord.transaction_ref && ` (Ref: ${ord.transaction_ref})`} • Ordered at {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Counter: {ord.pickup_counter || 'Main Bay'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--forest-green)' }}>
                          ₹{parseFloat(ord.total_amount).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(ord.items || []).length} items
                        </div>
                      </div>

                      <button
                        onClick={() => window.open(orderApi.getReceiptDownloadUrl(ord.id), '_blank')}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '4px' }}
                        title="Download official PDF receipt / order confirmation"
                      >
                        <FileText size={14} />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => setTrackingOrder(ord)}
                        className={`btn ${isActive ? 'btn-orange' : 'btn-secondary'}`}
                        style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                      >
                        <span>View Token</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Live Token Progress Tracker */}
      {trackingOrder && (
        <OrderTrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onRefresh={fetchMyOrders}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
