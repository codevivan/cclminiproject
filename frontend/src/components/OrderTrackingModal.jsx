import { Clock, CheckCircle2, ChefHat, Sparkles, X, MapPin, RefreshCw } from 'lucide-react';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Sent to canteen kitchen' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Accepted by canteen team' },
  { key: 'preparing', label: 'Preparing', desc: 'Chef is cooking your meal' },
  { key: 'ready', label: 'Ready for Pickup', desc: 'Hot & ready at counter' },
  { key: 'completed', label: 'Collected', desc: 'Completed and picked up' }
];

export const OrderTrackingModal = ({ order, onClose, onRefresh }) => {
  if (!order) return null;

  const currentStatus = order.status?.toLowerCase() || 'pending';
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const activeStep = currentIndex >= 0 ? currentIndex : 0;
  const progressPercent = isCancelled ? 0 : (activeStep / (STATUS_STEPS.length - 1)) * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'var(--forest-green)', color: '#fff' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
              Live Order Token
            </span>
            <h2 style={{ fontSize: '2rem', color: 'var(--warm-orange)', margin: '0.2rem 0 0', fontFamily: 'var(--font-heading)' }}>
              #{order.token_number}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Stepper */}
          <div className="order-stepper">
            <div className="stepper-progress-bar">
              <div className="stepper-progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>

            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < activeStep;
              const isCurrent = idx === activeStep;
              return (
                <div key={step.key} className="step-node">
                  <div
                    className={`step-circle ${
                      isCurrent ? 'active' : isPast ? 'completed' : ''
                    }`}
                  >
                    {isPast ? <CheckCircle2 size={18} /> : idx + 1}
                  </div>
                  <span className={`step-label ${isCurrent ? 'active' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status highlight callout */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: isCancelled ? '#fee2e2' : currentStatus === 'ready' ? '#d1fae5' : 'var(--bg-subtle)',
              border: `1px solid ${isCancelled ? '#fca5a5' : 'var(--border-light)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}
          >
            {isCancelled ? (
              <X size={24} color="#dc2626" />
            ) : currentStatus === 'ready' ? (
              <Sparkles size={24} color="var(--fresh-green)" />
            ) : (
              <ChefHat size={24} color="var(--forest-green)" />
            )}
            <div>
              <div style={{ fontWeight: 700, color: isCancelled ? '#b91c1c' : 'var(--text-dark)' }}>
                {isCancelled ? 'Order Cancelled by Staff' : currentStatus === 'ready' ? 'Food is Ready! Proceed to counter' : STATUS_STEPS[activeStep]?.desc}
              </div>
              <div style={{ fontSize: '0.82rem', color: isCancelled ? '#b91c1c' : 'var(--text-muted)' }}>
                {isCancelled ? 'Any counter payment or UPI transfer will be refunded.' : 'Show this digital token number at the pickup counter.'}
              </div>
            </div>
          </div>

          {/* Counter info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.85rem', background: 'var(--bg-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <MapPin size={13} /> PICKUP LOCATION
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--forest-green)' }}>
                {order.pickup_counter || 'Main Bay'}
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <Clock size={13} /> ORDER TIME
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div>
            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Items in this Token
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(order.items || []).map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-light)' }}>
                  <span>
                    <strong style={{ color: 'var(--forest-green)' }}>{it.quantity}x</strong> {it.item_name}
                  </span>
                  <span style={{ fontWeight: 600 }}>₹{it.subtotal || (it.unit_price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--forest-green)' }}>
              <span>Total Amount</span>
              <span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
          {/* Payment Status & Method Card */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              background: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAYMENT DETAILS</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                {order.payment_method || 'Cash at Counter'}
                {order.transaction_ref && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
                    (Ref: {order.transaction_ref})
                  </span>
                )}
              </div>
            </div>

            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background:
                    order.payment_status === 'PAID'
                      ? '#dcfce7'
                      : order.payment_status === 'PENDING_VERIFICATION'
                      ? '#fef3c7'
                      : '#fee2e2',
                  color:
                    order.payment_status === 'PAID'
                      ? '#15803d'
                      : order.payment_status === 'PENDING_VERIFICATION'
                      ? '#b45309'
                      : '#b91c1c'
                }}
              >
                {order.payment_status === 'PAID'
                  ? 'PAID · CONFIRMED'
                  : order.payment_status === 'PENDING_VERIFICATION'
                  ? 'REVIEW PENDING'
                  : 'PAYMENT PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            onClick={() => window.open(orderApi.getReceiptDownloadUrl(order.id), '_blank')}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 0.95rem', gap: '6px' }}
            title="Download PDF receipt"
          >
            <span>Download {order.payment_status === 'PAID' ? 'Paid Receipt' : 'Order Slip'} (PDF)</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingModal;
