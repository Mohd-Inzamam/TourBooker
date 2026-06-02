import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTourFilters } from '../../hooks/useTourFilters';
import { FilterChips } from '../../components/FilterChips';
import { TourCard } from '../../components/TourCard';
import RecommendationsCarousel from '../../components/RecommendationsCarousel';

const HomePage = () => {
  const navigate = useNavigate();
  const { tours, loading, filters, setFilter, fetchTours } = useTourFilters();
  const [searchInput, setSearchInput] = useState(filters.city || '');

  // Predefined categories for filtering
  const categoryOptions = ['Adventure', 'Luxury', 'Nature', 'Culture', 'Budget'];

  useEffect(() => {
    // Explicitly call fetchTours on mount as requested
    fetchTours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      navigate(`/tours?city=${encodeURIComponent(searchInput)}`);
    }
  };

  const handleCategoryChange = (selectedCategories) => {
    setFilter('categories', selectedCategories);
  };

  const handleViewAllTours = () => {
    navigate('/tours'); // Standard explore/tours route
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', background: 'var(--ag-bg, #f8fafc)', boxSizing: 'border-box', overflowX: 'hidden' }}>

      {/* 1) Hero Section */}
      <section style={{
        position: 'relative',
        width: '100%',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)), url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '80px 24px',
        boxSizing: 'border-box'
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '16px', maxWidth: '800px', lineHeight: 1.15, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          Find your next unforgettable journey
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '48px', opacity: 0.95, textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
          Discover guided tours, activities, and adventures around the world
        </p>

        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'white',
          padding: '8px',
          borderRadius: 'var(--ag-radius-xl, 16px)',
          width: '100%',
          maxWidth: '700px',
          boxShadow: 'var(--ag-shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
          alignItems: 'center'
        }}>
          <div className="ag-input-container" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '16px', color: 'var(--ag-text-muted, #64748b)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input
              type="text"
              className="ag-input"
              placeholder="Search by city, e.g. Paris"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              style={{ width: '100%', paddingLeft: '48px', border: 'none', background: 'transparent', boxShadow: 'none', fontSize: '1.05rem', minHeight: '48px', outline: 'none' }}
            />
          </div>
          <button
            className="ag-btn ag-btn-primary"
            onClick={() => navigate(`/tours?city=${encodeURIComponent(searchInput)}`)}
            style={{ padding: '0 32px', minHeight: '48px', fontSize: '1rem', borderRadius: 'var(--ag-radius-lg, 12px)' }}
          >
            Explore
          </button>
        </div>
      </section>

      {/* AI Recommendations Carousel — only visible when logged in */}
      <RecommendationsCarousel />

      {/* 2) Category Filter Section */}
      <section style={{ padding: '40px 24px', width: '100%', maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }}>
        <FilterChips
          options={categoryOptions}
          selected={filters.categories || []}
          onChange={handleCategoryChange}
        />
      </section>

      {/* 3) Tours Grid Section */}
      <section style={{ padding: '0 24px 80px', width: '100%', maxWidth: '1280px', margin: '0 auto', boxSizing: 'border-box' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '32px', color: 'var(--ag-text-main, #0f172a)' }}>
          Featured Tours
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--ag-text-muted, #64748b)', fontSize: '1.25rem' }}>
            Loading tours...
          </div>
        ) : (!tours || tours.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--ag-text-muted, #64748b)', fontSize: '1.25rem' }}>
            No tours found matching your search.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {tours.map((tour) => (
              <TourCard
                key={tour._id || tour.id}
                image={Array.isArray(tour.images) ? tour.images[0] : tour.image}
                title={tour.title}
                // {/* FIX 3: locationId is the populated Location object from backend */}
                location={tour.locationId?.city || tour.location?.city || tour.city || 'Global'}
                price={tour.price}
                rating={tour.ratingAverage}
                reviews={tour.ratingCount}
                onViewDetails={() => navigate(`/tours/${tour._id || tour.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4) View All Tours Button */}
      <section style={{ padding: '0 24px 80px', width: '100%', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }}>
        <button
          className="ag-btn ag-btn-secondary"
          onClick={handleViewAllTours}
          style={{ padding: '12px 48px', fontSize: '1.1rem', borderRadius: 'var(--ag-radius-pill, 999px)' }}
        >
          View All Tours
        </button>
      </section>

    </div>
  );
};

export default HomePage;
