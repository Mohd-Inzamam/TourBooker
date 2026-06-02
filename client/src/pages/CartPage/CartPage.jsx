import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertTriangle, Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { cartCheckout } from '../../services/cart.service';
import { Button } from '../../components/Button';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, cartCount, loading, hasStaleItems, updateItem, removeItem, clearCart, cleanStale, fetchCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  
  const [localSlots, setLocalSlots] = useState({});
  const timeoutRef = useRef(null);

  if (loading && !cart) {
    return <div className="ag-cart-wrapper" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}><div className="ag-spinner"></div></div>;
  }

  const handleCheckout = async () => {
    if (!cart?.items?.length) {
      setCheckoutError('Your cart is empty');
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const res = await cartCheckout();
      navigate('/checkout', { 
        state: { 
          clientSecret: res.clientSecret, 
          totalAmount: res.finalTotalAmount, 
          items: res.items,
          promoDiscount: res.promoDiscount,
          promoCode: cart?.promoCode,
          isDemoMode: !!res.isDemoMode
        } 
      });
    } catch (err) {
      if (err.unavailableItems) {
        setCheckoutError('Some items are no longer available. Please review your cart.');
        fetchCart();
      } else {
        setCheckoutError(err.message || 'Checkout failed.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUpdateSlots = (itemId, newSlots, maxSlots) => {
    if (newSlots < 1 || newSlots > maxSlots) return;

    setLocalSlots(prev => ({ ...prev, [itemId]: newSlots }));

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateItem(itemId, newSlots);
    }, 500);
  };

  const getSlotValue = (item) => localSlots[item._id] || item.slotsBooked;

  if (!cart || cartCount === 0) {
    return (
      <div className="ag-cart-wrapper" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <ShoppingCart size={64} color="var(--ag-text-muted)" style={{ margin: '0 auto', marginBottom: '1.5rem' }} />
        <h2 style={{ marginBottom: '1rem', color: 'var(--ag-text-main)' }}>Your cart is empty. Find something amazing!</h2>
        <Button onClick={() => navigate('/tours')} className="ag-btn-primary">Explore Tours</Button>
      </div>
    );
  }

  return (
    <div className="ag-cart-wrapper">
      <div className="ag-cart-grid">
        <div className="ag-cart-items-column">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h1 style={{ color: 'var(--ag-text-main)' }}>My Cart <span style={{ fontSize: '1rem', color: 'var(--ag-text-muted)', fontWeight: 'normal' }}>({cartCount} items)</span></h1>
          </div>

          {hasStaleItems && (
            <div className="ag-cart-stale-warning">
              <AlertTriangle size={24} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>Warning</div>
                <div>Some items in your cart are no longer available</div>
              </div>
              <Button onClick={cleanStale} style={{ background: '#d97706', border: 'none', color: '#fff' }}>
                Remove Unavailable Items
              </Button>
            </div>
          )}

          {checkoutError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--ag-error)', padding: '1rem', borderRadius: 'var(--ag-radius-md)', marginBottom: '1.5rem' }}>
              {checkoutError}
            </div>
          )}

          {cart.items.map(item => {
            const isStale = item.stale;
            const tourTitle = item.tourId ? item.tourId.title : 'Unavailable Tour';
            const tourImage = item.tourId && item.tourId.images && item.tourId.images[0] ? item.tourId.images[0] : null;
            const bookingDate = item.availabilityId ? new Date(item.availabilityId.date).toLocaleDateString() : 'Unknown Date';
            const maxSlots = item.availabilityId ? item.availabilityId.availableSlots : 0;
            const currentVal = getSlotValue(item);

            return (
              <div key={item._id} className={`ag-cart-item ${isStale ? 'stale' : ''}`}>
                <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: 'var(--ag-radius-md)', overflow: 'hidden' }}>
                  {tourImage ? <img src={tourImage} alt={tourTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </div>

                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--ag-text-main)', fontSize: '1.1rem' }}>{tourTitle}</h3>
                  <div style={{ color: 'var(--ag-text-muted)', fontSize: '0.85rem' }}>Booking Date: {bookingDate}</div>
                  
                  <div className="ag-slots-control" style={{ marginTop: '0.75rem', pointerEvents: isStale ? 'none' : 'auto' }}>
                     <button className="ag-slots-btn" onClick={() => handleUpdateSlots(item._id, currentVal - 1, maxSlots)}><Minus size={16} /></button>
                     <span style={{ fontSize: '0.95rem', fontWeight: '500', minWidth: '20px', textAlign: 'center' }}>{currentVal}</span>
                     <button className="ag-slots-btn" onClick={() => handleUpdateSlots(item._id, currentVal + 1, maxSlots)}><Plus size={16} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--ag-primary)', marginBottom: '0.5rem' }}>
                     ₹{item.lineTotal.toLocaleString()}
                   </div>
                   <button onClick={() => removeItem(item._id)} style={{ background: 'none', border: 'none', color: 'var(--ag-error)', cursor: 'pointer', padding: '0.5rem', display: 'flex', pointerEvents: 'auto' }}>
                     <Trash2 size={20} />
                   </button>
                </div>

                {isStale && (
                  <div className="ag-stale-overlay">
                    Unavailable — {item.staleReason}
                  </div>
                )}
              </div>
            );
          })}

        </div>

        <div className="ag-order-summary-container">
          <div className="ag-order-summary">
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--ag-text-main)' }}>Order Summary</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              {cart.items.map(item => (
                <div key={`summary-${item._id}`} className="ag-summary-line">
                  <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '180px' }}>{item.tourId ? item.tourId.title : 'Item'}</span>
                  <span>₹{item.lineTotal.toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="ag-summary-total">
               <span>Total</span>
               <span>₹{(cart.cartTotal || 0).toLocaleString()}</span>
            </div>

            <Button 
              className="ag-btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem' }} 
              onClick={handleCheckout} 
              isLoading={checkoutLoading}
              disabled={hasStaleItems || (cart.items.length === 0)}
            >
              Proceed to Checkout
            </Button>
            
            <button 
              onClick={clearCart} 
              style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: 'var(--ag-text-muted)', cursor: 'pointer', padding: '0.5rem', fontSize: '0.9rem' }}
              onMouseOver={(e) => e.target.style.color = 'var(--ag-error)'}
              onMouseOut={(e) => e.target.style.color = 'var(--ag-text-muted)'}
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
