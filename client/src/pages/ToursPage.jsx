import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Star, X, SlidersHorizontal, Calendar, Users, LocateFixed, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useTourFilters } from '../hooks/useTourFilters';
import { TourCard } from '../components/TourCard';
import { FilterChips } from '../components/FilterChips';
import { Button } from '../components/Button';
import { MapComponent } from '../components';
import '../styles/tours.css';

const ToursPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters, tours, total, loading, error, fetchTours } = useTourFilters();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [isMapView, setIsMapView] = useState(false);

  // Sync URL query 'location' with context filter on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const locParam = params.get('location') || params.get('city');
    if (locParam && filters.location !== locParam) {
      setFilter('location', locParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Categories list per requirements
  const CATEGORIES = ["Adventure", "Cultural", "Nature", "Luxury", "Food", "Wellness"];

  // Helper to remove individual filter
  const removeFilter = (key, valToRemove = null) => {
    if (key === 'categories' && valToRemove) {
      const newCats = filters.categories.filter(c => c !== valToRemove);
      setFilter('categories', newCats);
    } else {
      setFilter(key, '');
    }
  };

  const handleNearMeClick = () => {
    setGeoError('');
    if (filters.nearLat) {
      setFilter('nearLat', '');
      setFilter('nearLng', '');
      return;
    }
    
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFilter('nearLat', pos.coords.latitude);
          setFilter('nearLng', pos.coords.longitude);
          setFilter('radiusKm', 50); // Default
          setIsLocating(false);
        },
        (err) => {
          console.error(err);
          setGeoError('Location access denied. Please enable location in browser settings.');
          setIsLocating(false);
        }
      );
    } else {
      setGeoError('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  // Pagination logic
  const limit = filters.limit || 12; // 12 as per prompt
  const totalPages = Math.ceil(total / limit);
  const currentPage = filters.page || 1;

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setFilter('page', newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Active filter chips generation
  const renderActiveFilters = () => {
    const activeChips = [];
    if (filters.location) {
      activeChips.push(
        <span key="location" className="ag-active-chip">
          Location: {filters.location}
          <button className="ag-active-chip-remove" onClick={() => removeFilter('location')}><X size={14} /></button>
        </span>
      );
    }
    if (filters.nearLat) {
      activeChips.push(
        <span key="nearLocation" className="ag-active-chip">
          📍 Within {filters.radiusKm}km
          <button className="ag-active-chip-remove" onClick={() => { setFilter('nearLat', ''); setFilter('nearLng', ''); }}><X size={14} /></button>
        </span>
      );
    }
    if (filters.date) {
      activeChips.push(
        <span key="date" className="ag-active-chip">
          Date: {filters.date}
          <button className="ag-active-chip-remove" onClick={() => removeFilter('date')}><X size={14} /></button>
        </span>
      );
    }
    if (filters.minSlots > 1) {
      activeChips.push(
        <span key="minSlots" className="ag-active-chip">
          Spots: {filters.minSlots}
          <button className="ag-active-chip-remove" onClick={() => removeFilter('minSlots', 1)}><X size={14} /></button>
        </span>
      );
    }
    if (filters.minPrice || filters.maxPrice) {
      activeChips.push(
        <span key="price" className="ag-active-chip">
          Price: ₹{filters.minPrice || 0} - {filters.maxPrice ? `₹${filters.maxPrice}` : 'Max'}
          <button className="ag-active-chip-remove" onClick={() => { removeFilter('minPrice'); removeFilter('maxPrice'); }}><X size={14} /></button>
        </span>
      );
    }
    if (filters.rating) {
      activeChips.push(
        <span key="rating" className="ag-active-chip">
          Rating: {filters.rating}+ <Star size={10} fill="currentColor" style={{ marginLeft: '2px' }} />
          <button className="ag-active-chip-remove" onClick={() => removeFilter('rating')}><X size={14} /></button>
        </span>
      );
    }
    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach(cat => {
        activeChips.push(
          <span key={`cat-${cat}`} className="ag-active-chip">
            {cat}
            <button className="ag-active-chip-remove" onClick={() => removeFilter('categories', cat)}><X size={14} /></button>
          </span>
        );
      });
    }

    if (activeChips.length === 0) return null;

    return (
      <div className="ag-active-filters">
        {activeChips}
        <button
          className="ag-btn-ghost"
          style={{ padding: '4px 12px', fontSize: '0.85rem', border: 'none' }}
          onClick={resetFilters}
        >
          Clear All
        </button>
      </div>
    );
  };

  return (
    <div className="ag-tours-page">

      {/* Mobile Overlay */}
      <div
        className={`ag-sidebar-overlay ${isSidebarOpen ? 'ag-sidebar-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* FILTER SIDEBAR */}
      <aside className={`ag-tours-sidebar ${isSidebarOpen ? 'ag-sidebar-open' : ''}`}>
        <div className="ag-sidebar-header">
          <h2 className="ag-sidebar-title">Refine Results</h2>
          <button className="ag-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="ag-filter-group">
          <label className="ag-filter-label">Location</label>
          <button 
            type="button"
            className={`ag-near-me-btn ${filters.nearLat ? 'active' : ''}`}
            onClick={handleNearMeClick}
            disabled={isLocating}
            style={{ marginBottom: '0.75rem' }}
          >
            <LocateFixed size={18} />
            {isLocating ? 'Locating...' : filters.nearLat ? 'Searching Nearby' : 'Use My Location'}
          </button>
          
          {geoError && <p style={{ color: '#c9302c', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>{geoError}</p>}
          
          {filters.nearLat && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--ag-text-muted)' }}>Search Radius</label>
              <div className="ag-radius-pills">
                {[10, 25, 50, 100].map(rad => (
                  <button
                    key={rad}
                    className={`ag-radius-pill ${filters.radiusKm == rad ? 'active' : ''}`}
                    onClick={() => setFilter('radiusKm', rad)}
                  >
                    {rad}km
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="ag-filter-input-wrap">
            <Search size={18} className="ag-filter-icon" />
            <input
              type="text"
              className="ag-filter-input"
              placeholder="Or search city..."
              value={filters.location || ''}
              onChange={(e) => setFilter('location', e.target.value)}
              disabled={!!filters.nearLat}
            />
          </div>
        </div>

        {/* Filter 1.5: Date & Slots */}
        <div className="ag-filter-group">
          <label className="ag-filter-label"><Calendar size={14} style={{ marginRight: 4, display: 'inline' }} /> Date Filter</label>
          <div className="ag-filter-input-wrap">
            <input
              type="date"
              className="ag-filter-input"
              value={filters.date || ''}
              onChange={(e) => setFilter('date', e.target.value)}
              style={{ paddingLeft: '8px' }}
            />
          </div>
        </div>

        <div className="ag-filter-group" style={{ marginBottom: '16px' }}>
          <label className="ag-filter-label"><Users size={14} style={{ marginRight: 4, display: 'inline' }} /> Spots Needed</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--ag-surface)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--ag-border)' }}>
            <button
               type="button"
               style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}
               onClick={() => setFilter('minSlots', Math.max(1, (filters.minSlots || 1) - 1))}
            >-</button>
            <span style={{ fontWeight: 600, flex: 1, textAlign: 'center' }}>{filters.minSlots || 1}</span>
            <button
               type="button"
               style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}
               onClick={() => setFilter('minSlots', Math.min(20, (filters.minSlots || 1) + 1))}
            >+</button>
          </div>
        </div>

        {/* Filter 2: Price Range */}
        <div className="ag-filter-group">
          <label className="ag-filter-label">Price Range</label>
          <div className="ag-price-inputs">
            <input
              type="number"
              placeholder="Min ₹"
              value={filters.minPrice || ''}
              onChange={(e) => setFilter('minPrice', e.target.value)}
            />
            <span style={{ color: '#888' }}>-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={filters.maxPrice || ''}
              onChange={(e) => setFilter('maxPrice', e.target.value)}
            />
          </div>
        </div>

        {/* Filter 3: Minimum Rating */}
        <div className="ag-filter-group">
          <label className="ag-filter-label">Minimum Rating</label>
          <div className="ag-rating-stars">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`ag-star-btn ${filters.rating >= star ? 'active' : ''}`}
                onClick={() => setFilter('rating', star === filters.rating ? '' : star)}
              >
                <Star size={24} fill={filters.rating >= star ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* Filter 4: Category */}
        <div className="ag-filter-group">
          <label className="ag-filter-label">Category</label>
          <FilterChips
            options={CATEGORIES}
            selected={filters.categories || []}
            onChange={(selected) => setFilter('categories', selected)}
          />
        </div>

        {/* Filter 5: Sort By */}
        <div className="ag-filter-group">
          <label className="ag-filter-label">Sort By</label>
          <select
            className="ag-filter-select"
            value={filters.sortBy || ''}
            onChange={(e) => setFilter('sortBy', e.target.value)}
          >
            <option value="">Recommended</option>
            {/* FIX 2: values must match SORT_MAP keys in TourFilterContext */}
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        <div className="ag-sidebar-actions">
          <button className="ag-btn-gold" onClick={() => setIsSidebarOpen(false)}>
            Apply Filters
          </button>
          <button className="ag-btn-ghost" onClick={resetFilters}>
            Clear All
          </button>
        </div>
      </aside>

      {/* RESULTS AREA */}
      <main className="ag-results-area">
        <div className="ag-results-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="ag-mobile-filter-btn" onClick={() => setIsSidebarOpen(true)}>
              <SlidersHorizontal size={18} /> Filters
            </button>
            <h3 className="ag-results-count">
              {loading ? 'Searching...' : `Showing ${total} tour${total !== 1 ? 's' : ''}`}
            </h3>
          </div>
          <div className="ag-view-toggle">
            <button className={`ag-view-toggle-btn ${!isMapView ? 'active' : ''}`} onClick={() => setIsMapView(false)}>
              <LayoutGrid size={16} /> Grid View
            </button>
            <button className={`ag-view-toggle-btn ${isMapView ? 'active' : ''}`} onClick={() => setIsMapView(true)}>
              <MapIcon size={16} /> Map View
            </button>
          </div>
        </div>

        {renderActiveFilters()}

        {error && (
          <div className="ag-empty-state">
            <p style={{ color: '#c9302c' }}>{error}</p>
            <Button variant="primary" onClick={fetchTours}>Retry</Button>
          </div>
        )}

        {loading && !error ? (
          <div className="ag-tours-grid">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="ag-skeleton-card">
                <div className="ag-skeleton-img"></div>
                <div className="ag-skeleton-text"></div>
                <div className="ag-skeleton-text short"></div>
                <div className="ag-skeleton-shimmer"></div>
              </div>
            ))}
          </div>
        ) : !loading && tours.length === 0 && !error ? (
          <div className="ag-empty-state">
            <p>No tours found. Try adjusting your filters.</p>
            <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
          </div>
        ) : (
          <>
            {isMapView ? (
              (() => {
                const mapMarkers = tours.map(t => ({
                  id: t._id || t.id,
                  lat: t.coordinates?.lat,
                  lng: t.coordinates?.lng,
                  title: t.title,
                  price: t.price,
                  image: Array.isArray(t.images) ? t.images[0] : (t.image || t.images),
                  rating: t.ratingAverage
                })).filter(m => m.lat && m.lng);

                if (mapMarkers.length === 0) {
                  return (
                    <div className="ag-empty-state">
                      <MapIcon size={48} color="var(--ag-text-muted)" style={{ marginBottom: '16px' }} />
                      <p>Map view unavailable — no location data for current results</p>
                    </div>
                  );
                }

                return (
                  <MapComponent
                    mode="cluster"
                    markers={mapMarkers}
                    height="calc(100vh - 180px)"
                    className="ag-tours-map-view"
                  />
                );
              })()
            ) : (
              <div className="ag-tours-grid">
                {tours.map(tour => (
                  <TourCard
                    key={tour._id || tour.id}
                    image={Array.isArray(tour.images) ? tour.images[0] : (tour.image || tour.images)}
                    title={tour.title}
                    location={tour.locationId?.city || tour.location?.city || tour.city || 'Global'}
                    price={tour.price}
                    rating={tour.ratingAverage || 0}
                    reviews={tour.ratingCount || 0}
                    onViewDetails={() => navigate(`/tours/${tour._id || tour.id}`)}
                  />
                ))}
              </div>
            )}

            {!isMapView && totalPages > 1 && (
              <div className="ag-pagination">
                <button
                  className="ag-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                <span className="ag-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="ag-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
};

export default ToursPage;
