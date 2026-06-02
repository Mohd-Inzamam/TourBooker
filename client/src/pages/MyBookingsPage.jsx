import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users } from 'lucide-react';
import { getMyBookings, cancelBooking } from '../services/booking.service';
import { Button } from '../components/Button';
import '../styles/booking.css';

// Modal Component reused/adapted for Cancellation
const CancelModal = ({ isOpen, title, desc, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="ag-modal-overlay">
      <div className="ag-modal-card">
        <h3 className="ag-modal-title" style={{ color: 'var(--ag-danger)' }}>{title}</h3>
        <p className="ag-modal-desc">{desc}</p>
        <p style={{ marginTop: '8px', color: '#666' }}>Cancellation is subject to the operator's refund policy. Stripe refunds may take 5-7 business days.</p>
        <p style={{ fontWeight: 600, margin: '16px 0 24px', color: '#333' }}>This action cannot be undone.</p>
        <div className="ag-modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={loading} style={{ flex: 1 }}>Keep Booking</Button>
          <Button className="ag-btn-danger" onClick={onConfirm} isLoading={loading} style={{ flex: 1, border: 'none', background: 'var(--ag-danger)', color: '#fff' }}>Yes, Cancel</Button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type }) => {
  if (!message) return null;
  return <div className={`ag-toast ${type}`}>{message}</div>;
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  
  // Cancel logic
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyBookings();
      // FIX 1: backend wraps in data.data.bookings
      const userBookings = res?.data?.bookings ?? res?.data ?? [];
      setBookings(Array.isArray(userBookings) ? userBookings : []);
    } catch (err) {
      setError('Could not retrieve your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const handleCancelClick = (b) => {
    setBookingToCancel(b);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      const id = bookingToCancel._id || bookingToCancel.id;
      await cancelBooking(id);
      showToast('Booking cancelled successfully.');
      
      // Update UI optimistically
      setBookings(prev => prev.map(b => 
        (b._id || b.id) === id ? { ...b, status: 'cancelled' } : b
      ));
      setCancelModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Error parsing cancellation request', 'error');
    } finally {
      setIsCancelling(false);
      setBookingToCancel(null);
    }
  };

  // Filtering Logic
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    if (activeTab === 'Upcoming') {
      // Basic check: if it's confirmed AND date is in future (or simply confirmed)
      // Usually users want to see only 'confirmed' here anyway
      return b.status === 'confirmed'; 
    }
    return true;
  });

  return (
    <div className="ag-booking-container" style={{ padding: '40px 5%' }}>
      <Toast message={toast.msg} type={toast.type} />
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="ag-page-title">My Bookings</h1>
        <p className="ag-page-subtitle" style={{ margin: 0 }}>Your travel history and upcoming adventures</p>
      </div>

      <div className="ag-tabs">
        {['All', 'Upcoming', 'Cancelled'].map(tab => (
          <button 
            key={tab} 
            className={`ag-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ag-bookings-list">
        {error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--ag-danger)' }}>{error}</p>
            <Button variant="ghost" onClick={fetchBookings}>Retry</Button>
          </div>
        ) : loading ? (
          [1, 2, 3].map(n => (
            <div key={n} className="ag-booking-item" style={{ height: '180px', background: '#eaeaea' }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'agShimmer 1.5s infinite', position: 'relative' }}></div>
            </div>
          ))
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '16px' }}>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '24px' }}>You haven't booked any tours yet.</p>
            <Button onClick={() => navigate('/tours')}>Explore Tours</Button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#666' }}>No {activeTab.toLowerCase()} bookings found.</p>
          </div>
        ) : (
          filteredBookings.map(b => {
             const tour = b.tourId || {};
             // FIX 5: bookingDate is stored on booking doc — availabilityId is NOT populated
             const availabilityDate = b.bookingDate || Date.now();
             const isFutureBooking = new Date(availabilityDate) > new Date();
             const dateStr = new Date(availabilityDate).toLocaleDateString('en-GB', { 
               weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
             });
             const image = tour.images?.[0] || tour.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200';
             
             return (
               <div key={b._id || b.id} className="ag-booking-item">
                 <img src={image} alt="Tour thumbnail" className="ag-booking-item-img" />
                 
                 <div className="ag-booking-item-content">
                   <div className="ag-booking-item-header">
                     
                     <div>
                       <h3 className="ag-booking-item-title">{tour.title || 'Tour Loading...'}</h3>
                       <div className="ag-booking-item-meta">
                          {/* FIX 5: locationId is populated object on tourId */}
                          <span><MapPin size={14} style={{ display: 'inline', verticalAlign: '-2px' }}/> {tour.locationId?.city || tour.location?.city || tour.city || 'Global'}</span>
                         <span><Calendar size={14} style={{ display: 'inline', verticalAlign: '-2px' }}/> {dateStr}</span>
                         <span><Users size={14} style={{ display: 'inline', verticalAlign: '-2px' }}/> {b.slotsBooked} guests</span>
                       </div>
                     </div>
                     
                     <div className="ag-booking-item-right">
                       <span className="ag-booking-item-price">₹{b.totalPrice}</span>
                       <span className={`ag-badge ${b.status === 'confirmed' ? 'ag-badge-success' : b.status === 'cancelled' ? 'ag-badge-danger' : 'ag-badge-warning'}`}>
                         {b.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}
                       </span>
                       
                       {b.status === 'confirmed' && isFutureBooking && (
                         <button 
                           className="ag-btn-cancel-ghost"
                           style={{ marginTop: 'auto' }}
                           onClick={() => handleCancelClick(b)}
                         >
                           Cancel Booking
                         </button>
                       )}
                       {b.status === 'confirmed' && !isFutureBooking && (
                         <span className="ag-badge ag-badge-warning" style={{ marginTop: 'auto' }}>Completed</span>
                       )}
                     </div>

                   </div>
                 </div>
               </div>
             );
          })
        )}
      </div>

      <CancelModal 
        isOpen={cancelModalOpen}
        title="Cancel this booking?"
        desc={`Tour: ${bookingToCancel?.tourId?.title || 'Unknown Tour'} on ${new Date(bookingToCancel?.bookingDate || Date.now()).toLocaleDateString()}`}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={confirmCancel}
        loading={isCancelling}
      />

    </div>
  );
};

export default MyBookingsPage;
