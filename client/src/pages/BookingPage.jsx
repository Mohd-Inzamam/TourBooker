import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MapPin, Lock, CheckCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getTourDetails } from '../services/tour.service';
import { createBooking } from '../services/booking.service';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import '../styles/booking.css';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tourDetails, setTourDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  
  // Success state UI
  const [successBookingId, setSuccessBookingId] = useState(null);

  // Destructure state fallback
  const bookingState = location.state || {};
  const { tourId, availabilityId, slotsBooked, totalPrice } = bookingState;

  useEffect(() => {
    // Rigid gateway: if no state is provided from a valid 'Book Now' click, rebound.
    if (!tourId || !availabilityId) {
      navigate('/tours', { replace: true });
      return;
    }

    const fetchContext = async () => {
      try {
        const res = await getTourDetails(tourId);
        setTourDetails(res.data?.data || res.data || res.tour || res);
      } catch (err) {
        setError('Could not retrieve tour details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [tourId, availabilityId, navigate]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!termsAccepted) return;
    
    setIsSubmitting(true);
    try {
      const res = await createBooking({ tourId, availabilityId, slotsBooked });
      const bookingRecord = res.data?.booking || res.booking || res.data || res;
      setSuccessBookingId(bookingRecord._id || bookingRecord.id || 'N/A');
    } catch (err) {
      setError(err.message || 'Booking failed to process. Try again later.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="ag-booking-container"><p>Initializing secure checkout...</p></div>;
  }

  // --- Success State UI ---
  if (successBookingId) {
    return (
      <div className="ag-booking-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="ag-success-state">
          <div className="ag-success-icon">
            <CheckCircle size={40} />
          </div>
          <h1 className="ag-page-title" style={{ fontSize: '2.8rem' }}>Booking Confirmed!</h1>
          <p className="ag-page-subtitle" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Your adventure awaits. A confirmation has been sent.</p>
          
          <div className="ag-success-box">
            Booking ID: #{String(successBookingId).slice(-8).toUpperCase()}
          </div>
          
          <div className="ag-success-actions">
            <Button onClick={() => navigate('/my-bookings')}>View My Bookings</Button>
            <Button variant="ghost" onClick={() => navigate('/tours')}>Explore More Tours</Button>
          </div>
        </div>
      </div>
    );
  }

  // Formatting constraints
  const image = tourDetails?.images?.[0] || tourDetails?.image || 'https://via.placeholder.com/400x200';
  const locationText = tourDetails?.location?.city || tourDetails?.city || 'Global Location';
  // Attempt to parse out availability date safely if it was passed via state or backend
  const dateStr = availabilityId ? 'Selected Date' : 'Unknown Date'; 

  return (
    <div className="ag-booking-container">
      <h1 className="ag-page-title">Complete Your Booking</h1>
      <p className="ag-page-subtitle">Review your details before confirming</p>

      <div className="ag-booking-layout">
        
        {/* Left Form */}
        <div className="ag-booking-main">
          
          <div className="ag-booking-card">
            <h2>Guest Details</h2>
            <p className="ag-booking-card-sub" style={{ marginBottom: '24px' }}>
              You're booking as <strong>{user?.name || 'Guest'}</strong>
            </p>
            
            <div className="ag-booking-section">
              <FormInput 
                label="Full Name" 
                value={user?.name || ''} 
                readOnly 
                className="ag-readonly-input"
              />
              <FormInput 
                label="Email Address" 
                value={user?.email || ''} 
                readOnly 
                className="ag-readonly-input"
                style={{ marginTop: '16px' }}
              />
            </div>

            <div className="ag-booking-section" style={{ marginTop: '32px' }}>
              <label className="ag-form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Special Requests (optional)
              </label>
              <textarea 
                className="ag-form-input" 
                rows="4" 
                placeholder="Dietary requirements, accessibility needs..."
              ></textarea>
            </div>

            <div className="ag-booking-terms">
              <input 
                type="checkbox" 
                id="termsCheck" 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <label htmlFor="termsCheck" style={{ color: '#444', lineHeight: 1.5 }}>
                I agree to the booking terms and cancellation policy. I understand that cancellations within 24 hours are non-refundable.
              </label>
            </div>

            {error && <div style={{ color: 'var(--ag-danger)', marginBottom: '16px', fontWeight: 500 }}>{error}</div>}

            <button 
              className="ag-btn-confirm" 
              disabled={!termsAccepted || isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
          
        </div>

        {/* Right Summary */}
        <div className="ag-booking-sidebar">
          <div className="ag-summary-card">
            <img src={image} alt="Tour thumbnail" className="ag-summary-img" />
            <div className="ag-summary-content">
              <h3 className="ag-summary-title">{tourDetails?.title || 'Loading tour...'}</h3>
              <div className="ag-summary-loc"><MapPin size={16} /> {locationText}</div>
              
              <div className="ag-summary-divider"></div>
              
              <div className="ag-summary-row">
                <span>Date:</span>
                <span style={{ fontWeight: 500 }}>{dateStr}</span>
              </div>
              <div className="ag-summary-row">
                <span>Guests:</span>
                <span style={{ fontWeight: 500 }}>{slotsBooked}</span>
              </div>
              <div className="ag-summary-row">
                <span>Price per person:</span>
                <span style={{ fontWeight: 500 }}>₹{tourDetails?.price || (totalPrice / slotsBooked)}</span>
              </div>
              
              <div className="ag-summary-divider"></div>
              
              <div className="ag-summary-total">
                <span className="ag-summary-total-label">Total</span>
                <span className="ag-summary-total-val">₹{totalPrice}</span>
              </div>

              <div className="ag-summary-trust">
                <div className="ag-summary-trust-item"><Lock size={16} color="var(--ag-gold)"/> Secure Booking</div>
                <div className="ag-summary-trust-item"><CheckCircle size={16} color="var(--ag-gold)"/> Instant Confirmation</div>
                <div className="ag-summary-trust-item"><RotateCcw size={16} color="var(--ag-gold)"/> Free Cancellation (48hr)</div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingPage;
