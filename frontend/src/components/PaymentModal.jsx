import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Banknote,
  CreditCard,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { orderApi } from '../services/api';
import AlertMessage from './AlertMessage';

export const PaymentModal = ({
  isOpen,
  onClose,
  cartItems,
  total,
  notes,
  onOrderSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState('UPI'); // 'UPI' | 'Cash' | 'Credit Card' | 'Debit Card'
  const [upiConfig, setUpiConfig] = useState({
    canteen_name: 'Campus Canteen',
    upi_id: 'canteen@okhdfcbank',
    upi_name: 'Campus Canteen Billing'
  });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch UPI config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await orderApi.getPaymentConfig();
        if (res?.config) {
          setUpiConfig(res.config);
        }
      } catch (err) {
        console.warn('Using default UPI config:', err.message);
      }
    };
    fetchConfig();
  }, []);

  // Generate UPI QR code whenever config or total changes
  useEffect(() => {
    if (selectedMethod === 'UPI' && total > 0) {
      const upiUri = `upi://pay?pa=${upiConfig.upi_id}&pn=${encodeURIComponent(
        upiConfig.upi_name || upiConfig.canteen_name
      )}&am=${total.toFixed(2)}&cu=INR&tn=CanteenPreOrder`;

      QRCode.toDataURL(upiUri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#174C3C',
          light: '#FFFFFF'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate UPI QR:', err));
    }
  }, [selectedMethod, total, upiConfig]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiConfig.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleConfirmOrder = async () => {
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        items: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity
        })),
        notes: notes ? notes.trim() : '',
        payment_method: selectedMethod,
        transaction_ref: selectedMethod === 'UPI' ? transactionRef.trim() : null
      };

      const response = await orderApi.createOrder(payload);

      if (onOrderSuccess) {
        onOrderSuccess(response.order);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit order. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warm-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Final Checkout Step
            </div>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--forest-green)', margin: '0.2rem 0 0' }}>
              Select Payment Method
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={22} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem 0' }}>
          <AlertMessage type="error" message={error} />

          {/* Amount Summary Ribbon */}
          <div
            style={{
              background: 'var(--bg-cream)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL AMOUNT DUE</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                {cartItems.length} {cartItems.length === 1 ? 'dish' : 'dishes'} in tray
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--forest-green)' }}>
              ₹{total.toFixed(2)}
            </div>
          </div>

          {/* 4 Selectable Payment Options */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: 700 }}>
              Choose How You Want to Pay:
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Option 1: UPI */}
              <div
                onClick={() => setSelectedMethod('UPI')}
                style={{
                  border: selectedMethod === 'UPI' ? '2px solid var(--forest-green)' : '1px solid var(--border-light)',
                  background: selectedMethod === 'UPI' ? 'rgba(23, 76, 60, 0.04)' : '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: selectedMethod === 'UPI' ? 'var(--forest-green)' : 'var(--bg-cream)',
                    color: selectedMethod === 'UPI' ? '#FFFFFF' : 'var(--forest-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <QrCode size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-dark)' }}>UPI Payment</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    GPay, PhonePe, Paytm QR
                  </div>
                </div>
              </div>

              {/* Option 2: Cash at Counter */}
              <div
                onClick={() => setSelectedMethod('Cash')}
                style={{
                  border: selectedMethod === 'Cash' ? '2px solid var(--forest-green)' : '1px solid var(--border-light)',
                  background: selectedMethod === 'Cash' ? 'rgba(23, 76, 60, 0.04)' : '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: selectedMethod === 'Cash' ? 'var(--forest-green)' : 'var(--bg-cream)',
                    color: selectedMethod === 'Cash' ? '#FFFFFF' : 'var(--forest-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Banknote size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-dark)' }}>Cash at Counter</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Pay physical cash at billing
                  </div>
                </div>
              </div>

              {/* Option 3: Credit Card */}
              <div
                onClick={() => setSelectedMethod('Credit Card')}
                style={{
                  border: selectedMethod === 'Credit Card' ? '2px solid var(--forest-green)' : '1px solid var(--border-light)',
                  background: selectedMethod === 'Credit Card' ? 'rgba(23, 76, 60, 0.04)' : '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: selectedMethod === 'Credit Card' ? 'var(--forest-green)' : 'var(--bg-cream)',
                    color: selectedMethod === 'Credit Card' ? '#FFFFFF' : 'var(--forest-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-dark)' }}>Credit Card</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    POS machine at counter
                  </div>
                </div>
              </div>

              {/* Option 4: Debit Card */}
              <div
                onClick={() => setSelectedMethod('Debit Card')}
                style={{
                  border: selectedMethod === 'Debit Card' ? '2px solid var(--forest-green)' : '1px solid var(--border-light)',
                  background: selectedMethod === 'Debit Card' ? 'rgba(23, 76, 60, 0.04)' : '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: selectedMethod === 'Debit Card' ? 'var(--forest-green)' : 'var(--bg-cream)',
                    color: selectedMethod === 'Debit Card' ? '#FFFFFF' : 'var(--forest-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-dark)' }}>Debit Card</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Tap / Swipe at counter
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Option Detail View */}

          {/* 1. UPI DETAIL VIEW */}
          {selectedMethod === 'UPI' && (
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                background: '#FFFFFF'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--forest-green)', marginBottom: '0.25rem' }}>
                  SCAN WITH ANY UPI APP TO PAY
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Google Pay · PhonePe · Paytm · BHIM · Amazon Pay
                </div>

                {/* QR Code Container */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '10px',
                    background: '#FFFFFF',
                    border: '2px solid var(--border-light)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                    margin: '0.85rem auto'
                  }}
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Canteen UPI QR Code"
                      style={{ width: '180px', height: '180px', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="spinner"></span>
                    </div>
                  )}
                </div>

                {/* UPI ID Copy Bar */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'var(--bg-cream)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.85rem'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>UPI ID:</span>
                  <strong style={{ color: 'var(--forest-green)', letterSpacing: '0.02em' }}>{upiConfig.upi_id}</strong>
                  <button
                    onClick={handleCopyUpi}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', height: 'auto', gap: '4px' }}
                    title="Copy UPI ID to clipboard"
                  >
                    {copiedUpi ? (
                      <>
                        <Check size={12} color="var(--fresh-green)" />
                        <span style={{ color: 'var(--fresh-green)', fontWeight: 700 }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Transaction Ref UTR input */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  UPI Reference / UTR Number (Optional, from your payment app)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 429182749102"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  maxLength={50}
                />
              </div>

              {/* Status Warning Note */}
              <div
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  gap: '0.6rem',
                  fontSize: '0.8rem',
                  color: '#92400E',
                  lineHeight: 1.45
                }}
              >
                <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Note:</strong> Clicking <em>"I Have Paid"</em> submits your order with status{' '}
                  <strong>PAYMENT_REVIEW</strong>. Canteen staff will verify the transaction reference before marking it{' '}
                  <strong>PAID</strong>.
                </span>
              </div>
            </div>
          )}

          {/* 2. CASH AT COUNTER DETAIL VIEW */}
          {selectedMethod === 'Cash' && (
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                background: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'var(--fresh-green-light)',
                    color: 'var(--fresh-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Banknote size={24} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.4rem', color: 'var(--forest-green)', fontSize: '1.05rem' }}>
                    Pay Exact Cash at Counter
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Your pre-order token will be generated immediately with status <strong>PAYMENT PENDING</strong> so the
                    kitchen can begin preparations. Please hand over <strong>₹{total.toFixed(2)}</strong> in cash at Counter 1
                    upon token call.
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  background: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ShieldCheck size={16} color="var(--fresh-green)" />
                <span>The canteen cashier will confirm receipt of your cash and mark your order as PAID.</span>
              </div>
            </div>
          )}

          {/* 3. CARD (CREDIT / DEBIT) DETAIL VIEW */}
          {(selectedMethod === 'Credit Card' || selectedMethod === 'Debit Card') && (
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                background: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(244, 163, 64, 0.15)',
                    color: '#b46b14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.4rem', color: 'var(--forest-green)', fontSize: '1.05rem' }}>
                    Counter Card Machine Payment ({selectedMethod})
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Card payment must be completed at the physical canteen billing counter. For your safety,{' '}
                    <strong>we never ask for card numbers, PINs, or CVVs online</strong>.
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  background: 'var(--bg-cream)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ShieldCheck size={16} color="var(--fresh-green)" />
                <span>Order will be placed as PENDING. Simply tap or swipe at the counter POS to confirm payment.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
            Back to Tray
          </button>

          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={submitting}
            className="btn btn-primary"
            style={{ minWidth: '180px', padding: '0.75rem 1.25rem' }}
          >
            {submitting ? (
              <>
                <span className="spinner"></span>
                <span>Issuing Digital Token...</span>
              </>
            ) : selectedMethod === 'UPI' ? (
              <>
                <span>I Have Paid · Place Order</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <span>Confirm & Place Order</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
