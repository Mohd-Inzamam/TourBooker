import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle, XCircle, Download } from 'lucide-react';
import { verifyPayment } from '../../services/payment.service';
import { getMyBookings } from '../../services/booking.service';
import { generateTicket } from '../../services/receipt.service';
import { Button } from '../../components/Button';
import './BookingConfirmationPage.css';

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const paymentIntentId = location.state?.paymentIntentId;
  const isCartCheckout = location.state?.isCartCheckout;
  const isDemoMode = location.state?.isDemoMode;
  const itemCount = location.state?.itemCount || 1;
  
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!paymentIntentId) return;

    let isMounted = true;
    const maxAttempts = 10; // Poll every 2 seconds for up to 20 seconds
    const pollInterval = 2000;

    const verify = async (attempt = 1) => {
      if (!isMounted) return;

      try {
        if (isCartCheckout) {
          const res = await getMyBookings();
          if (res && res.status === 'success' && res.data && res.data.bookings) {
            // Find bookings that specifically match this payment intent
            const matchedBookings = res.data.bookings.filter(
              (b) => b.paymentIntentId === paymentIntentId
            );

            // Wait until we have all the items for this cart purchase
            if (matchedBookings.length >= itemCount) {
              const sorted = matchedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              setBookings(sorted.slice(0, itemCount));
              setLoading(false);
              return;
            }
          }
        } else {
          const response = await verifyPayment(paymentIntentId);
          if (response && response.success && response.booking) {
            setBooking(response.booking);
            setLoading(false);
            return;
          }
        }

        // If not found and attempts remain, poll again
        if (attempt < maxAttempts) {
          setTimeout(() => verify(attempt + 1), pollInterval);
        } else {
          // Exhausted attempts
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Verification error on attempt ${attempt}:`, err);
        if (attempt < maxAttempts) {
          setTimeout(() => verify(attempt + 1), pollInterval);
        } else {
          setError(true);
          setLoading(false);
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [paymentIntentId, isCartCheckout, itemCount]);

  if (!paymentIntentId) {
    return <Navigate to="/my-bookings" replace />;
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const data = isCartCheckout ? bookings : booking;
      await generateTicket(data);
    } catch (err) {
      console.error("Ticket download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="ag-confirmation-wrapper">
        <div style={{ textAlign: 'center' }}>
          <div className="ag-loading-spinner" style={{ marginBottom: '1rem' }}></div>
          <p style={{ color: 'var(--ag-text-muted)' }}>Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="ag-confirmation-wrapper">
        <div className="ag-confirmation-card">
          <XCircle size={64} style={{ color: 'var(--ag-error)' }} className="ag-confirmation-icon" />
          <h2 style={{ marginBottom: '1rem', color: 'var(--ag-text-main)' }}>Payment Verification Failed</h2>
          <p style={{ color: 'var(--ag-text-muted)', marginBottom: '1.5rem' }}>
            Please contact support with your reference ID.
          </p>
          <div className="ag-reference-code">
            {paymentIntentId}
          </div>
          <div className="ag-confirmation-actions" style={{ marginTop: '2rem' }}>
            <Button onClick={() => navigate('/tours')} className="ag-btn ag-btn-primary" style={{ width: '100%' }}>
              Return to Tours
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ag-confirmation-wrapper">
      <div className="ag-confirmation-card">
        <CheckCircle size={64} style={{ color: 'var(--ag-success, #22c55e)' }} className="ag-confirmation-icon" />
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--ag-text-main)' }}>Booking Confirmed!</h2>
        
        {isCartCheckout ? (
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            {bookings.map((bk, idx) => (
             <div key={idx} style={{ marginBottom: '1rem', backgroundColor: 'var(--ag-bg)', padding: '1rem', borderRadius: 'var(--ag-radius-md)' }}>
               <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--ag-text-muted)' }}>Tour</span>
                 <span style={{ fontWeight: 600, color: 'var(--ag-text-main)' }}>{bk.tourId?.title}</span>
               </div>
               <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--ag-text-muted)' }}>Date</span>
                 <span style={{ color: 'var(--ag-text-main)' }}>{new Date(bk.bookingDate || bk.availabilityId?.date).toLocaleDateString()}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--ag-text-muted)' }}>Travelers</span>
                 <span style={{ color: 'var(--ag-text-main)' }}>{bk.slotsBooked}</span>
               </div>
             </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'left', marginBottom: '2rem', backgroundColor: 'var(--ag-bg)', padding: '1rem', borderRadius: 'var(--ag-radius-md)' }}>
            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ag-text-muted)' }}>Tour</span>
              <span style={{ fontWeight: 600, color: 'var(--ag-text-main)' }}>{booking.tourId?.title}</span>
            </div>
            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ag-text-muted)' }}>Date</span>
              <span style={{ color: 'var(--ag-text-main)' }}>{new Date(booking.bookingDate || booking.availabilityId?.date).toLocaleDateString()}</span>
            </div>
            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ag-text-muted)' }}>Travelers</span>
              <span style={{ color: 'var(--ag-text-main)' }}>{booking.slotsBooked}</span>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--ag-border)', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
              <span style={{ color: 'var(--ag-text-muted)' }}>Total Paid</span>
              <span style={{ color: 'var(--ag-primary)' }}>₹{booking.totalPrice}</span>
            </div>
          </div>
        )}

        <div className="ag-confirmation-actions">
           <Button 
            onClick={handleDownload} 
            className="ag-btn ag-btn-secondary" 
            style={{ width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--ag-primary)', color: 'white', border: 'none' }}
            disabled={downloading}
          >
            <Download size={18} />
            {downloading ? 'Preparing Ticket...' : 'Download My Ticket'}
          </Button>
          <Button onClick={() => navigate('/my-bookings')} className="ag-btn ag-btn-secondary" style={{ width: '100%', marginBottom: '12px' }}>
            View My Bookings
          </Button>
          <Button onClick={() => navigate('/tours')} className="ag-btn ag-btn-ghost" style={{ width: '100%' }}>
            Explore More Tours
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
