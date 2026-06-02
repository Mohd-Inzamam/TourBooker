import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle } from 'lucide-react';
import { createPaymentIntent, confirmDemoPayment } from '../../services/payment.service';
import { Button } from '../../components/Button';
import { FormError } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import './CheckoutPage.css';

// Initialize Stripe outside component render to avoid recreating Stripe object
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutForm = ({ stateData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We will build a dedicated success page later, but for now we just handle it here if redirect="if_required"
      },
      redirect: "if_required" // Prevent auto-redirect so we can handle SPA navigation
    });

    if (submitError) {
      setError(submitError.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      navigate('/booking-confirmation', { 
        state: { 
          paymentIntentId: paymentIntent.id,
          isCartCheckout: !!stateData.clientSecret,
          itemCount: stateData.items?.length || 1
        }
      });
    } else {
      setError("An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div className="ag-payment-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <Button 
        type="submit" 
        className="ag-btn ag-btn-primary" 
        style={{ width: '100%', marginTop: '1.5rem', padding: '14px' }}
        disabled={!stripe || isProcessing}
        isLoading={isProcessing}
      >
        Pay Now
      </Button>
    </form>
  );
};

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [isDemoVerifying, setIsDemoVerifying] = useState(false);
  const [error, setError] = useState('');
  
  // From Route state: { tourId, availabilityId, slotsBooked, tourTitle, totalAmount, pricePerSlot, date }
  const stateData = location.state;

  useEffect(() => {
    if (!stateData) return;

    const initPayment = async () => {
      try {
        if (stateData.clientSecret) {
          setClientSecret(stateData.clientSecret);
          setPaymentIntentId(stateData.clientSecret.split('_secret_')[0] || '');
          setIsDemoMode(!!stateData.isDemoMode);
          return;
        }

        const response = await createPaymentIntent({
          tourId: stateData.tourId,
          availabilityId: stateData.availabilityId,
          slotsBooked: stateData.slotsBooked,
          promoCode: stateData.promoCode
        });
        if (response && response.clientSecret) {
          setClientSecret(response.clientSecret);
          setPaymentIntentId(response.clientSecret.split('_secret_')[0] || '');
          setIsDemoMode(response.isDemoMode === true || response.data?.isDemoMode === true);
        } else {
          setError('Failed to initialize payment.');
        }
      } catch (err) {
        setError(err.message || 'Payment initialization failed.');
      }
    };

    initPayment();
  }, [stateData]);

  useEffect(() => {
    if (!stateData || (!stateData.clientSecret && !stateData.tourId)) {
      navigate('/tours', {
        replace: true,
        state: { message: 'Please select a tour to proceed to checkout' }
      });
    }
  }, [navigate, stateData]);

  if (!stateData || (!stateData.clientSecret && !stateData.tourId)) {
    return <Navigate to="/tours" replace />;
  }

  const handleDemoPayment = async () => {
    try {
      setError('');
      setIsDemoSubmitting(true);
      await new Promise((r) => setTimeout(r, 2000));
      setIsDemoSubmitting(false);
      setIsDemoVerifying(true);
      await new Promise((r) => setTimeout(r, 1000));
      await confirmDemoPayment(paymentIntentId);
      navigate('/booking-confirmation', {
        state: {
          paymentIntentId,
          isDemoMode: true,
          isCartCheckout: !!stateData.items,
          itemCount: stateData.items?.length || 1
        }
      });
    } catch (err) {
      setError(err.message || 'Demo payment failed.');
    } finally {
      setIsDemoSubmitting(false);
      setIsDemoVerifying(false);
    }
  };

  return (
    <div className="ag-checkout-wrapper">
      <div className="ag-checkout-grid">
        {/* LEFT COLUMN: Order Summary */}
        <div className="ag-order-summary">
          <h2>Order Summary</h2>
          {stateData.items ? (
            <div style={{ marginBottom: '1rem' }}>
              {stateData.items.map((item, idx) => (
                <div key={idx} className="ag-summary-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ag-text-main)' }}>{item.tourTitle}</span>
                    <span style={{ fontWeight: 600, color: 'var(--ag-text-main)' }}>₹{(item.lineTotal || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ag-text-muted)' }}>
                    {new Date(item.bookingDate).toLocaleDateString()} • {item.slotsBooked} slots
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="ag-summary-row">
                <span>Tour</span>
                <span style={{color: 'var(--ag-text-main)', fontWeight: 600}}>{stateData.tourTitle}</span>
              </div>
              {stateData.date && (
                <div className="ag-summary-row">
                  <span>Date</span>
                  <span style={{color: 'var(--ag-text-main)'}}>{new Date(stateData.date).toLocaleDateString()}</span>
                </div>
              )}
              <div className="ag-summary-row">
                <span>Travelers</span>
                <span style={{color: 'var(--ag-text-main)'}}>{stateData.slotsBooked}</span>
              </div>
              <div className="ag-summary-row">
                <span>Price per traveler</span>
                <span style={{color: 'var(--ag-text-main)'}}>₹{stateData.pricePerSlot || (stateData.totalAmount / stateData.slotsBooked)}</span>
              </div>
            </>
          )}
          
          <div className="ag-summary-divider"></div>

          {stateData.promoDiscount > 0 && (
            <div className="ag-summary-row" style={{ color: 'var(--ag-success, #22c55e)' }}>
              <span>Promo ({stateData.promoCode})</span>
              <span>-₹{(stateData.promoDiscount || 0).toLocaleString()}</span>
            </div>
          )}
          
          <div className="ag-order-total">
            <span>Total</span>
            <span>₹{(stateData.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Payment Form */}
        <div className="ag-payment-form">
          <h2>Payment Details</h2>
          {error && <FormError message={error} type="general" />}
          
          {!clientSecret && !error && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Preparing checkout...
            </div>
          )}

          {clientSecret && !isDemoMode && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm stateData={stateData} />
            </Elements>
          )}

          {clientSecret && isDemoMode && (
            <div className="ag-demo-payment-form">
              <div>
                <label className="ag-form-label">Card Number</label>
                <div className="ag-demo-card-field">
                  <input className="ag-form-input" readOnly value="4242 4242 4242 4242" style={{ opacity: 0.8, cursor: 'default' }} />
                  <span className="ag-demo-card-badge">VISA</span>
                </div>
              </div>

              <div className="ag-demo-card-row">
                <div>
                  <label className="ag-form-label">Expiry</label>
                  <input className="ag-form-input" readOnly value="12/28" style={{ opacity: 0.8, cursor: 'default' }} />
                </div>
                <div>
                  <label className="ag-form-label">CVC</label>
                  <input className="ag-form-input" readOnly type="password" value="***" style={{ opacity: 0.8, cursor: 'default' }} />
                </div>
              </div>

              <div>
                <label className="ag-form-label">Cardholder Name</label>
                <input className="ag-form-input" readOnly value={user?.name || 'Demo User'} style={{ opacity: 0.8, cursor: 'default' }} />
              </div>

              <Button
                type="button"
                className="ag-btn ag-btn-primary"
                style={{ width: '100%' }}
                onClick={handleDemoPayment}
                isLoading={isDemoSubmitting || isDemoVerifying}
                disabled={isDemoSubmitting || isDemoVerifying || !paymentIntentId}
              >
                {isDemoSubmitting ? 'Processing...' : isDemoVerifying ? 'Verifying payment...' : `Pay ₹${(stateData.totalAmount || 0).toLocaleString()}`}
              </Button>

              <div className="ag-demo-security-badges">
                <span className="ag-demo-security-badge">🔒 SSL Secured</span>
                <span className="ag-demo-security-badge">✓ 256-bit Encryption</span>
                <span className="ag-demo-security-badge">🛡️ Demo Safe</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
