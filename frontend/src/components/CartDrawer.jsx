import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, AlertTriangle } from 'lucide-react';
import { canteenApi } from '../services/api';
import AlertMessage from './AlertMessage';
import PaymentModal from './PaymentModal';

export const CartDrawer = ({ onOrderPlaced }) => {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, subtotal, tax, total } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [canteenStatus, setCanteenStatus] = useState({ status: 'open', notice: '' });

  useEffect(() => {
    if (isCartOpen) {
      canteenApi.getStatus()
        .then((res) => {
          if (res?.status) setCanteenStatus(res.status);
        })
        .catch(() => {});
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const isOrderBlocked = canteenStatus.status === 'paused' || canteenStatus.status === 'closed';

  const handleProceedToPayment = () => {
    setError('');

    if (isOrderBlocked) {
      setError(
        canteenStatus.status === 'paused'
          ? `Ordering is temporarily paused: ${canteenStatus.notice || 'Please check back shortly.'}`
          : `The canteen is closed for today: ${canteenStatus.notice || 'Orders are not being accepted.'}`
      );
      return;
    }

    if (!isAuthenticated) {
      setIsCartOpen(false);
      navigate('/login', { state: { message: 'Please sign in to place your order.' } });
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    // Open Payment Selection Modal
    setIsPaymentModalOpen(true);
  };

  const handleOrderSuccess = (newOrder) => {
    clearCart();
    setIsPaymentModalOpen(false);
    setIsCartOpen(false);

    if (onOrderPlaced) {
      onOrderPlaced(newOrder);
    } else {
      navigate('/student/dashboard', { state: { latestOrder: newOrder } });
    }
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={22} color="var(--forest-green)" />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Your Canteen Tray</h3>
            <span className="badge badge-student" style={{ marginLeft: '0.4rem' }}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            aria-label="Close cart"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="cart-drawer-body">
          <AlertMessage type="error" message={error} />

          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--bg-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <ShoppingBag size={28} color="var(--text-muted)" />
              </div>
              <h4 style={{ color: 'var(--text-dark)', marginBottom: '0.4rem' }}>Your tray is empty</h4>
              <p style={{ fontSize: '0.9rem' }}>Select delicious dishes from the canteen menu to start your pre-order.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-drawer-item">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--forest-green)', fontWeight: 700 }}>
                    ₹{item.price} each
                  </div>
                </div>

                {/* Stepper */}
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '0.3rem' }}
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}

          {cartItems.length > 0 && (
            <div style={{ marginTop: 'auto' }}>
              <label className="form-label" htmlFor="order-notes" style={{ fontSize: '0.82rem' }}>
                Kitchen Notes / Allergy Instructions (Optional)
              </label>
              <input
                id="order-notes"
                type="text"
                className="form-input"
                placeholder="e.g. Extra spicy, less oil, parcel packing..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                style={{ fontSize: '0.88rem', padding: '0.65rem 0.85rem' }}
              />
            </div>
          )}
        </div>

        {/* Footer with totals and action */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-row">
              <span>Campus Tax & Packaging (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="cart-row total">
              <span>Estimated Order Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            {isOrderBlocked && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.82rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              >
                <AlertTriangle size={16} color="#dc2626" />
                <span>
                  <strong>{canteenStatus.status === 'paused' ? 'Ordering Paused:' : 'Canteen Closed:'}</strong>{' '}
                  {canteenStatus.notice || 'Orders are currently not accepted.'}
                </span>
              </div>
            )}

            <button
              onClick={handleProceedToPayment}
              disabled={isOrderBlocked}
              className={`btn ${isOrderBlocked ? 'btn-secondary' : 'btn-orange'}`}
              id="btn-confirm-checkout"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                opacity: isOrderBlocked ? 0.6 : 1,
                cursor: isOrderBlocked ? 'not-allowed' : 'pointer'
              }}
            >
              {isOrderBlocked ? (
                <span>Ordering Paused / Closed</span>
              ) : isAuthenticated ? (
                <>
                  <CreditCard size={18} />
                  <span>Proceed to Payment • ₹{total.toFixed(2)}</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <span>Sign In to Place Order</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              <ShieldCheck size={14} color="var(--fresh-green)" />
              <span>UPI QR, Cash, Credit & Debit Card supported</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Selection Interface Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartItems={cartItems}
        total={total}
        notes={notes}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
};

export default CartDrawer;
