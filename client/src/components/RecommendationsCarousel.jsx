import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TourCard } from './TourCard';
import { getRecommendations } from '../services/ai.service';
import '../styles/recommendations.css';

const RecommendationsCarousel = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchReco = async () => {
      try {
        const res = await getRecommendations();
        const data = res.data?.recommendations || res.recommendations || res.data || [];
        setTours(Array.isArray(data) ? data : []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchReco();
  }, [isAuthenticated]);

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 0);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  const scroll = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  // Don't render at all when not logged in
  if (!isAuthenticated) return null;

  return (
    <section className="ag-reco-section">
      <div className="ag-reco-header">
        <div className="ag-reco-title-wrap">
          <h2>Recommended For You</h2>
          <div className="ag-reco-gold-bar"></div>
          <p className="ag-reco-subtitle">Curated by AI based on your interests</p>
        </div>

        {!loading && !error && tours.length > 0 && (
          <div className="ag-reco-arrows">
            <button
              className="ag-reco-arrow"
              onClick={() => scroll('left')}
              disabled={atStart}
              aria-label="Scroll left"
            >‹</button>
            <button
              className="ag-reco-arrow"
              onClick={() => scroll('right')}
              disabled={atEnd}
              aria-label="Scroll right"
            >›</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="ag-reco-carousel">
          {[1, 2, 3].map(n => <div key={n} className="ag-reco-skeleton" />)}
        </div>
      ) : error ? (
        <p className="ag-reco-error">Unable to load recommendations</p>
      ) : tours.length === 0 ? (
        <p className="ag-reco-empty">Explore tours to get personalized recommendations</p>
      ) : (
        <div
          className="ag-reco-carousel"
          ref={carouselRef}
          onScroll={handleScroll}
        >
          {tours.map(tour => (
            <div key={tour._id || tour.id} className="ag-reco-card-wrap">
              <TourCard
                image={Array.isArray(tour.images) ? tour.images[0] : tour.image}
                title={tour.title}
                location={tour.location?.city || tour.city}
                price={tour.price}
                rating={tour.ratingAverage}
                reviews={tour.ratingCount}
                duration={`${tour.duration || 1} days`}
                onViewDetails={() => navigate(`/tours/${tour._id || tour.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendationsCarousel;
