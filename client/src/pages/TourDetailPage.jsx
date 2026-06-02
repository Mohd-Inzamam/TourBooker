import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Check, X as XIcon, BadgeCheck, ShoppingCart, CheckCircle, MapPinOff, Compass } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { getTourDetails, getTourAvailability, getTours } from '../services/tour.service';
import { calculatePrice, validatePromo } from '../services/pricing.service';
import { sendInquiry } from '../services/messaging.service';
import ReviewsSection from '../components/ReviewsSection';
import StarRating from '../components/StarRating';
import { MapComponent } from '../components';
import { TourCard } from '../components/TourCard';
import { formatDate } from '../utils/formatDate';
import { formatPrice } from '../utils/formatPrice';
import '../styles/tour-detail.css';

const TourDetailPage = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Add Cart features securely
  const { cart, addItem, loading: cartLoading } = useCart() || {};
  const [toastMessage, setToastMessage] = useState('');
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);

  const [tour, setTour] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImage, setActiveImage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [guests, setGuests] = useState(1);
  const [dateError, setDateError] = useState(false);

  const [inquiryText, setInquiryText] = useState('');
  const [showInquiryLine, setShowInquiryLine] = useState(false);
  const [sendingInquiry, setSendingInquiry] = useState(false);

  const [dynamicPriceInfo, setDynamicPriceInfo] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const [nearbyTours, setNearbyTours] = useState([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tourRes, availRes] = await Promise.all([
          getTourDetails(tourId, { requiresAuth: false }),
          getTourAvailability(tourId, { requiresAuth: false }).catch(() => ({ data: { availabilities: [] } }))
        ]);

        // FIX 1: backend wraps in data.data.tour
        const tourData = tourRes?.data?.tour || tourRes?.data || tourRes;
        // FIX 4: backend returns data.data.availabilities
        const availRaw = availRes?.data?.availabilities || [];
        // FIX 4: compute availableSlots client-side (not stored in DB)
        const availData = availRaw.map(a => ({
          ...a,
          availableSlots: a.totalSlots - (a.bookedSlots || 0)
        }));

        setTour(tourData);
        setAvailability(Array.isArray(availData) ? availData : []);

        // Set initial images
        const images = Array.isArray(tourData.images) ? tourData.images : (tourData.image ? [tourData.image] : []);
        if (images.length > 0) setActiveImage(images[0]);

      } catch (err) {
        console.error('Error fetching tour:', err);
        setError('Tour not found or something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    if (tourId) fetchData();
  }, [tourId]);

  useEffect(() => {
    if (tour?.coordinates?.lat && tour?.coordinates?.lng) {
      const fetchNearby = async () => {
        try {
          const res = await getTours({
            nearLat: tour.coordinates.lat,
            nearLng: tour.coordinates.lng,
            radiusKm: 30,
            limit: 5
          }, { requiresAuth: false });
          const related = res?.data?.tours || [];
          setNearbyTours(related.filter(item => item._id !== (tour._id || tour.id)).slice(0, 4));
        } catch (e) {
          console.error("Failed to load nearby tours", e);
        }
      };
      fetchNearby();
    }
  }, [tour]);

  useEffect(() => {
    if (!selectedDate || !tour) return;

    setIsCalculating(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await calculatePrice({
          tourId: tour._id || tour.id,
          availabilityId: selectedDate._id,
          slotsBooked: guests
        });
        if (res.status === 'success') {
          setDynamicPriceInfo(res.data);
          if (appliedPromo) {
            handleValidatePromo(appliedPromo.promotion.code, res.data.totalAmount);
          }
        }
      } catch (err) {
        console.error("Price calc failed", err);
      } finally {
        setIsCalculating(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [selectedDate, guests, tour]);

  const handleValidatePromo = async (codeToApply, amountToValidate) => {
    const code = codeToApply || promoCode;
    const amount = amountToValidate || (dynamicPriceInfo ? dynamicPriceInfo.totalAmount : tour.price * guests);

    if (!code) return;
    setIsApplyingPromo(true);
    setPromoError('');

    try {
      const res = await validatePromo({
        code,
        tourId: tour._id || tour.id,
        orderAmount: amount
      });
      if (res.status === 'success') {
        setAppliedPromo(res.data);
        if (!codeToApply) setPromoCode('');
      } else {
        setPromoError(res.message || 'Invalid promo');
      }
    } catch (err) {
      setPromoError(err.message || 'Invalid promo code');
      if (appliedPromo && appliedPromo.promotion.code === code) {
        setAppliedPromo(null);
      }
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  // Handle booking action
  const handleBookNow = () => {
    if (bookingActionLoading) return;
    setBookingActionLoading(true);
    if (!isAuthenticated) {
      navigate('/login');
      setBookingActionLoading(false);
      return;
    }
    if (!selectedDate) {
      setDateError(true);
      setBookingActionLoading(false);
      return;
    }

    setDateError(false);
    navigate('/checkout', {
      state: {
        tourId: tour._id || tour.id,
        availabilityId: selectedDate._id,
        slotsBooked: guests,
        tourTitle: tour.title,
        date: selectedDate.date,
        totalAmount: appliedPromo ? appliedPromo.finalAmount : (dynamicPriceInfo ? dynamicPriceInfo.totalAmount : tour.price * guests),
        pricePerSlot: dynamicPriceInfo ? dynamicPriceInfo.finalPrice : tour.price,
        promoCode: appliedPromo ? appliedPromo.promotion.code : undefined,
        promoDiscount: appliedPromo ? appliedPromo.discountAmount : 0
      }
    });
    setBookingActionLoading(false);
  };

  const handleSendInquiry = async () => {
    if (!inquiryText.trim()) return;
    setSendingInquiry(true);
    try {
      const operatorId = tour.operatorId._id || tour.operatorId;
      await sendInquiry({ operatorId, tourId: tour._id || tour.id, message: inquiryText });
      navigate('/messages');
    } catch (err) {
      console.error(err);
      alert("Could not send inquiry.");
    } finally {
      setSendingInquiry(false);
    }
  };

  const handleAddToCart = async () => {
    if (addToCartLoading) return;
    setAddToCartLoading(true);
    if (!isAuthenticated) {
      navigate('/login');
      setAddToCartLoading(false);
      return;
    }
    if (!selectedDate) {
      setDateError(true);
      setAddToCartLoading(false);
      return;
    }
    if (guests <= 0) return;

    setDateError(false);
    try {
      await addItem({ tourId: tour._id || tour.id, availabilityId: selectedDate._id, slotsBooked: guests });
      setToastMessage('Added to cart!');
      setTimeout(() => setToastMessage(''), 2500);
    } catch (err) {
      setToastMessage(err.message || 'Failed to add to cart');
      setTimeout(() => setToastMessage(''), 2500);
    } finally {
      setAddToCartLoading(false);
    }
  };

  const isInCart = cart?.items?.some(
    item => (item.tourId?._id === (tour?._id || tour?.id) || item.tourId === (tour?._id || tour?.id)) &&
      (item.availabilityId?._id === selectedDate?._id || item.availabilityId === selectedDate?._id)
  );

  // Skeleton Loader
  if (loading) {
    return (
      <div className="ag-td-container">
        <div className="ag-td-skel-hero ag-td-shimmer"></div>
        <div className="ag-td-content-wrapper">
          <div className="ag-td-main">
            <div className="ag-td-skel-line title ag-td-shimmer"></div>
            <div className="ag-td-skel-line ag-td-shimmer"></div>
            <div className="ag-td-skel-line ag-td-shimmer"></div>
            <div className="ag-td-skel-line ag-td-shimmer" style={{ width: '80%' }}></div>
          </div>
          <div className="ag-td-sidebar">
            <div className="ag-td-sticky" style={{ height: '400px' }}>
              <div className="ag-td-skel-line ag-td-shimmer" style={{ height: '60px', marginBottom: '24px' }}></div>
              <div className="ag-td-skel-line ag-td-shimmer"></div>
              <div className="ag-td-skel-line ag-td-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !tour) {
    return (
      <div className="ag-td-container ag-td-error">
        <p>{error || 'Tour not found'}</p>
        <button className="ag-td-btn-ghost" style={{ width: '200px' }} onClick={() => navigate('/tours')}>
          Back to Tours
        </button>
      </div>
    );
  }

  // FIX 3: use populated field names from backend
  const images = Array.isArray(tour.images) ? tour.images : (tour.image ? [tour.image] : []);
  const inclusions = tour.inclusions || ['Professional Guide', 'Transportation', 'Entry Tickets'];
  const exclusions = tour.exclusions || ['Meals', 'Personal Expenses'];
  const rating = tour.ratingAverage || 0;
  const reviewCount = tour.ratingCount || 0;
  const hasAnyAvailability = availability.length > 0;
  const hasBookableAvailability = availability.some((slot) => slot.availableSlots > 0);
  const operatorName = tour.operatorId?.name || 'Local Expert';
  // companyName not in User model — fallback gracefully
  const companyName = tour.operatorId?.companyName || tour.operatorId?.name || 'Verified Partner';
  // FIX 3: locationId is the populated Location object
  const cityName = tour.locationId?.city || tour.location?.city || tour.city || 'Global';
  const countryName = tour.locationId?.country || tour.location?.country || tour.country || '';

  return (
    <div className="ag-td-container">

      {/* SECTION 1: Image Gallery */}
      <section className="ag-td-gallery">
        <div className="ag-td-hero-img-wrapper">
          <img src={activeImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'} alt={tour.title} className="ag-td-hero-img" />
          <div className="ag-td-hero-overlay"></div>
          <h1 className="ag-td-hero-title">{tour.title}</h1>
        </div>

        {images.length > 1 && (
          <div className="ag-td-thumbnail-strip">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Thumbnail ${idx}`}
                className={`ag-td-thumbnail ${activeImage === img ? 'active' : ''}`}
                onClick={() => setActiveImage(img)}
              />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: Main Content */}
      <section className="ag-td-content-wrapper">

        {/* Left Column - Storytelling */}
        <div className="ag-td-main">
          <div className="ag-td-breadcrumb">
            <Link to="/">Home</Link> &gt; <Link to="/tours">Tours</Link> &gt; <span style={{ color: 'var(--ag-charcoal)' }}>{cityName}</span>
          </div>

          {/* FIX 3: categoryId is the populated Category object */}
          {tour.categoryId?.name && (
            <span className="ag-td-chip">{tour.categoryId.name}</span>
          )}

          <div className="ag-td-meta">
            <div className="ag-td-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {rating > 0 ? (
                <>
                  <StarRating rating={rating} size="sm" />
                  <span style={{ fontWeight: 600, color: 'var(--ag-charcoal)' }}>{rating}</span>
                  <span className="ag-td-rating-count">({reviewCount} reviews)</span>
                </>
              ) : (
                <span style={{ color: 'var(--ag-charcoal)' }}>New Tour</span>
              )}
            </div>
            <div className="ag-td-meta-item">
              <MapPin size={18} color="var(--ag-gold)" />
              {cityName}{countryName ? `, ${countryName}` : ''}
            </div>
          </div>

          <h2 className="ag-td-section-heading">About This Tour</h2>
          <p className="ag-td-desc">{tour.description}</p>

          <div className="ag-td-inclusions">
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>What's Included</h3>
              <ul className="ag-td-inc-list included">
                {inclusions.map((item, i) => (
                  <li key={i}><Check size={18} className="ag-td-icon-inc" /> {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Not Included</h3>
              <ul className="ag-td-inc-list excluded">
                {exclusions.map((item, i) => (
                  <li key={i}><XIcon size={18} className="ag-td-icon-exc" /> {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ag-td-operator">
            <div className="ag-td-op-avatar">{operatorName.charAt(0)}</div>
            <div className="ag-td-op-info">
              <h4>{operatorName} <BadgeCheck size={16} color="var(--ag-gold)" style={{ verticalAlign: 'middle' }} /></h4>
              <p>Managed by {companyName}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Panel */}
        <div className="ag-td-sidebar">
          <div className="ag-td-sticky">

            <div className="ag-td-price-block">
              {dynamicPriceInfo && dynamicPriceInfo.appliedRule ? (
                <>
                  <span className="ag-td-price-muted" style={{ textDecoration: 'line-through', marginRight: '8px' }}>₹{dynamicPriceInfo.basePrice}</span>
                  <span className="ag-td-price-val">{formatPrice(dynamicPriceInfo.finalPrice)}</span>
                  <span className="ag-td-price-muted">per person</span>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{
                      background: 'rgba(201, 168, 76, 0.12)', color: 'var(--ag-primary)',
                      borderRadius: 'var(--ag-radius-pill)', padding: '0.2rem 0.75rem',
                      fontSize: '0.75rem', fontWeight: 600
                    }}>
                      🔖 {dynamicPriceInfo.appliedRule.name} {dynamicPriceInfo.appliedRule.adjustmentValue > 0 ? '+' : ''}{dynamicPriceInfo.appliedRule.adjustmentValue}{dynamicPriceInfo.appliedRule.adjustmentType === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="ag-td-price-muted">From</span>
                  <span className="ag-td-price-val">{formatPrice(tour.price)}</span>
                  <span className="ag-td-price-muted">per person</span>
                </>
              )}
            </div>

            <div className="ag-td-divider"></div>

            <h3 className="ag-td-dates-heading">Select a Date</h3>
            <div className="ag-td-dates-list">
              {availability.length > 0 ? (
                availability.map(avail => {
                  const isSoldOut = avail.availableSlots === 0;
                  const isActive = selectedDate?._id === avail._id;
                  // Formatting date logic
                  const dateStr = formatDate(avail.date);

                  return (
                    <div
                      key={avail._id}
                      className={`ag-td-date-card ${isSoldOut ? 'sold-out' : ''} ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (!isSoldOut) {
                          setSelectedDate(avail);
                          setDateError(false);
                          // Reset guests constraint
                          if (guests > avail.availableSlots) setGuests(avail.availableSlots);
                        }
                      }}
                    >
                      <span className="ag-td-date-val">{dateStr}</span>
                      <span className="ag-td-slots-val">
                        {isSoldOut ? 'Sold Out' : `${avail.availableSlots} slots left`}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>No available dates right now. Check back soon or message the operator.</p>
              )}
            </div>
            {hasAnyAvailability && !hasBookableAvailability && (
              <p style={{ color: '#888', fontStyle: 'italic', marginBottom: '1rem' }}>All dates are fully booked.</p>
            )}

            {dateError && <div style={{ color: 'var(--ag-error)', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Please select an available date first</div>}

            <div className="ag-td-counter">
              <span className="ag-td-counter-label">Number of Guests</span>
              <div className="ag-td-counter-controls">
                <button
                  className="ag-td-counter-btn"
                  disabled={guests <= 1 || !selectedDate}
                  onClick={() => setGuests(g => g - 1)}
                >−</button>
                <span className="ag-td-counter-val">{guests}</span>
                <button
                  className="ag-td-counter-btn"
                  disabled={!selectedDate || guests >= selectedDate.availableSlots}
                  onClick={() => setGuests(g => g + 1)}
                >+</button>
              </div>
            </div>

            {/* Price Breakdown */}
            {selectedDate && (
              <div className="ag-price-breakdown" style={{ opacity: isCalculating ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{guests} × ₹{dynamicPriceInfo ? dynamicPriceInfo.finalPrice : tour.price}</span>
                  <span>₹{dynamicPriceInfo ? dynamicPriceInfo.totalAmount : (tour.price * guests)}</span>
                </div>
                {appliedPromo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ag-success)' }}>
                    <span>Promo: {appliedPromo.promotion.code}</span>
                    <span>-₹{appliedPromo.discountAmount}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--ag-border)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem' }}>
                  <span>Total</span>
                  <span>₹{appliedPromo ? appliedPromo.finalAmount : (dynamicPriceInfo ? dynamicPriceInfo.totalAmount : tour.price * guests)}</span>
                </div>
              </div>
            )}

            {/* Promo Section */}
            {selectedDate && (
              <div className="ag-promo-section" style={{ paddingBottom: '1.5rem' }}>
                {appliedPromo ? (
                  <div className="ag-promo-success">
                    <CheckCircle size={16} />
                    <span>{appliedPromo.promotion.description || appliedPromo.promotion.code} applied!</span>
                    <button onClick={removePromo} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginLeft: 'auto', textDecoration: 'underline', fontSize: '0.8rem' }}>Remove</button>
                  </div>
                ) : (
                  <>
                    <div className="ag-promo-input-row">
                      <input
                        type="text"
                        placeholder="Have a promo code?"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        style={{ flex: 1, padding: '10px 12px', border: promoError ? '1px solid var(--ag-error)' : '1px solid var(--ag-border)', borderRadius: '8px' }}
                      />
                      <button
                        onClick={() => handleValidatePromo(null, null)}
                        disabled={!promoCode || isApplyingPromo}
                        style={{ padding: '10px 16px', background: 'var(--ag-charcoal)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        {isApplyingPromo ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoError && <div style={{ color: 'var(--ag-error)', fontSize: '0.8rem', marginTop: '4px' }}>{promoError}</div>}
                  </>
                )}
              </div>
            )}

            {hasBookableAvailability && <div className="ag-tour-actions" style={{ marginBottom: '16px' }}>
              <button
                className="ag-td-btn-book"
                disabled={!selectedDate || selectedDate.availableSlots === 0 || bookingActionLoading}
                onClick={handleBookNow}
              >
                {bookingActionLoading ? 'Booking...' : 'Book Now'}
              </button>
              <button
                className="ag-td-btn-ghost ag-btn-secondary"
                disabled={!selectedDate || selectedDate.availableSlots === 0 || cartLoading || addToCartLoading}
                onClick={handleAddToCart}
              >
                <ShoppingCart size={20} />
                {addToCartLoading ? 'Adding...' : (isInCart ? "Update Cart" : "Add to Cart")}
              </button>
            </div>}

            {/* Inquiry Trigger */}
            {isAuthenticated && user?.role === 'user' && (
              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                {showInquiryLine ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <textarea value={inquiryText} onChange={e => setInquiryText(e.target.value)} placeholder="Ask the operator a question..." rows={2} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.8rem', resize: 'none' }}></textarea>
                    <button onClick={handleSendInquiry} disabled={sendingInquiry || !inquiryText.trim()} style={{ background: 'var(--ag-charcoal)', color: '#fff', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>{sendingInquiry ? 'Sending...' : 'Send Inquiry'}</button>
                  </div>
                ) : (
                  <button onClick={() => setShowInquiryLine(true)} className="ag-btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--ag-primary)', border: 'none', background: 'none' }}>Ask Operator a Question</button>
                )}
              </div>
            )}

            <button className="ag-td-btn-ghost" style={{ width: '100%', marginTop: '1rem' }}>
              Save to Wishlist
            </button>

          </div>
        </div>
      </section>

      {/* SECTION MAP: Where You'll Be */}
      <div className="ag-td-container" style={{ paddingBottom: '0' }}>
         <h2 className="ag-td-section-heading" style={{ marginBottom: '16px' }}><MapPin size={20} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} color="var(--ag-charcoal)"/>Where You'll Be</h2>
         
         {tour.coordinates?.lat && tour.coordinates?.lng ? (
           <>
             <MapComponent
               mode="single"
               singleMarker={{
                 lat: tour.coordinates.lat,
                 lng: tour.coordinates.lng,
                 title: tour.title,
                 address: `${cityName}, ${countryName}`
               }}
               height="350px"
               zoom={13}
             />
             <p style={{ fontSize: '0.9rem', color: 'var(--ag-text-muted)', marginTop: '8px' }}>
                📍 {cityName}, {countryName}
             </p>
           </>
         ) : (
           <div className="ag-map-no-location" style={{ background: 'var(--ag-bg)', borderRadius: 'var(--ag-radius-xl)', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: 'var(--ag-text-muted)' }}>
             <MapPinOff size={32} /> Location not available
           </div>
         )}
      </div>

      {nearbyTours.length > 0 && (
         <div className="ag-td-container" style={{ paddingBottom: '0' }}>
             <h2 className="ag-td-section-heading" style={{ marginBottom: '16px' }}><Compass size={20} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} color="var(--ag-charcoal)"/>More Tours Nearby</h2>
             <div className="ag-nearby-tours-row" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'thin', scrollbarColor: 'var(--ag-primary) var(--ag-bg)' }}>
                {nearbyTours.map(nt => (
                  <div key={nt._id || nt.id} style={{ minWidth: '260px', flexShrink: 0 }}>
                    <TourCard
                      image={Array.isArray(nt.images) ? nt.images[0] : (nt.image || nt.images)}
                      title={nt.title}
                      location={nt.locationId?.city || nt.location?.city || nt.city || 'Global'}
                      price={nt.price}
                      rating={nt.ratingAverage || 0}
                      reviews={nt.ratingCount || 0}
                      onViewDetails={() => navigate(`/tours/${nt._id || nt.id}`)}
                    />
                  </div>
                ))}
             </div>
         </div>
      )}

      {/* SECTION 3: Reviews — live, fetched, filterable */}
      <div className="ag-td-container" style={{ paddingTop: '2rem' }}>
        <ReviewsSection tourId={tourId} />
      </div>

      {/* Mobile Fixed Booking Bar */}
      {selectedDate && (
        <div className="ag-td-mobile-fixed">
          <div>
            <div className="ag-td-price-muted" style={{ marginBottom: '-4px' }}>Total Price</div>
            <span className="ag-td-price-val" style={{ fontSize: '1.5rem', margin: 0 }}>
              ₹{appliedPromo ? appliedPromo.finalAmount : (dynamicPriceInfo ? dynamicPriceInfo.totalAmount : tour.price * guests)}
            </span>
          </div>
          <div className="ag-tour-actions" style={{ margin: 0, width: 'auto', flex: 1, marginLeft: '1rem', flexWrap: 'nowrap' }}>
            <button className="ag-td-btn-ghost ag-btn-secondary" style={{ padding: '12px' }} disabled={!selectedDate || selectedDate.availableSlots === 0 || cartLoading} onClick={handleAddToCart}>
              <ShoppingCart size={20} />
            </button>
            <button className="ag-td-btn-book" style={{ margin: 0, padding: '12px 24px' }} onClick={handleBookNow}>Book Now</button>
          </div>
        </div>
      )}

      {/* Toast Display */}
      {toastMessage && (
        <div className="ag-add-cart-toast">
          <CheckCircle size={20} color="var(--ag-success, #22c55e)" />
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default TourDetailPage;
