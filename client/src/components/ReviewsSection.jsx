import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import ReviewCard from './ReviewCard';
import WriteReviewForm from './WriteReviewForm';
import StarRating from './StarRating';
import { getReviews, getTourSentimentSummary } from '../services/review.service';
import '../styles/reviews.css';

const PAGE_SIZE = 6;

/* ── Skeleton card ───────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="ag-review-skel">
    <div className="ag-review-skel-line xshort" style={{ height: '40px', borderRadius: '50%', width: '40px', marginBottom: '14px' }} />
    <div className="ag-review-skel-line" />
    <div className="ag-review-skel-line short" />
    <div className="ag-review-skel-line" />
    <div className="ag-review-skel-line" />
    <div className="ag-review-skel-line xshort" />
  </div>
);

/* ── Sentiment count bar ─────────────────────────────────── */
const SentimentBar = ({ tourId }) => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getTourSentimentSummary(tourId).then(res => {
      if (res.data && res.data.totalAnalyzed >= 3) {
        setSummary(res.data);
      }
    }).catch(() => {});
  }, [tourId]);

  if (!summary) return null;

  const posPct = Math.round((summary.positiveCount / summary.totalAnalyzed) * 100);
  const neuPct = Math.round((summary.neutralCount / summary.totalAnalyzed) * 100);
  const negPct = Math.round((summary.negativeCount / summary.totalAnalyzed) * 100);

  return (
    <div className="ag-sentiment-summary">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', fontSize: '1.1rem' }}>
         <TrendingUp size={18} /> Guest Sentiment
      </h3>
      <div className="ag-sentiment-bar-container">
         <div className="ag-sentiment-bar-positive" style={{ width: `${posPct}%` }}></div>
         <div className="ag-sentiment-bar-neutral" style={{ width: `${neuPct}%` }}></div>
         <div className="ag-sentiment-bar-negative" style={{ width: `${negPct}%` }}></div>
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', fontWeight: 600, marginTop: '8px' }}>
         <span style={{ color: 'var(--ag-success)' }}>{posPct}% Positive</span>
         <span style={{ color: '#94a3b8' }}>{neuPct}% Neutral</span>
         <span style={{ color: 'var(--ag-error)' }}>{negPct}% Negative</span>
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────── */
const ReviewsSection = ({ tourId }) => {
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [sortBy,   setSortBy]   = useState('recent');
  const [visible,  setVisible]  = useState(PAGE_SIZE);

  const fetchReviews = () => {
    setLoading(true);
    setError(null);
    getReviews(tourId)
      .then(res => {
        const arr = res.data?.reviews || res.data || res.reviews || res;
        setReviews(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setError('Unable to load reviews.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (tourId) fetchReviews(); }, [tourId]);

  /* Derived stats */
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  /* Sorted + filtered view */
  const sorted = useMemo(() => {
    const list = [...reviews];
    if (sortBy === 'recent')   return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'highest')  return list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'lowest')   return list.sort((a, b) => a.rating - b.rating);
    if (sortBy === 'positive') return list.filter(r => r.sentiment === 'positive');
    return list;
  }, [reviews, sortBy]);

  const displayed  = sorted.slice(0, visible);
  const hasMore    = visible < sorted.length;

  /* ── Render ───────────────────────────────────────────── */
  return (
    <section className="ag-reviews-section" id="reviews" aria-label="Reviews">

      {/* Header row */}
      <div className="ag-reviews-header">
        <div>
          <h2 className="ag-reviews-heading">What Travellers Say</h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '0.9rem' }}>
            {loading ? '' : `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {!loading && reviews.length > 0 && (
          <div className="ag-reviews-rating-summary">
            <p className="ag-reviews-big-number">{avgRating}</p>
            <StarRating rating={avgRating} size="md" />
            <p className="ag-reviews-based-on">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* Sentiment bar */}
      {!loading && reviews.length > 0 && <SentimentBar tourId={tourId} />}

      {/* Write review form */}
      <WriteReviewForm
        tourId={tourId}
        existingReviews={reviews}
        onReviewSubmitted={fetchReviews}
      />

      {/* Loading skeletons */}
      {loading && (
        <div className="ag-reviews-grid">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="ag-reviews-error">
          {error}
          <button onClick={fetchReviews}>Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && reviews.length === 0 && (
        <div className="ag-reviews-empty">
          <span className="ag-reviews-empty-icon">✦</span>
          <h3>No reviews yet</h3>
          <p>Be the first to share your experience below</p>
        </div>
      )}

      {/* Sort row */}
      {!loading && sorted.length > 0 && (
        <div className="ag-reviews-sort-row">
          <select
            className="ag-reviews-sort-select"
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setVisible(PAGE_SIZE); }}
            aria-label="Sort reviews"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="positive">Most Positive</option>
          </select>
        </div>
      )}

      {/* Review cards grid */}
      {!loading && displayed.length > 0 && (
        <>
          <div className="ag-reviews-grid">
            {displayed.map(rev => (
              <ReviewCard key={rev._id} review={rev} />
            ))}
          </div>

          {hasMore && (
            <button
              className="ag-reviews-load-more"
              onClick={() => setVisible(v => v + PAGE_SIZE)}
            >
              Load More Reviews
            </button>
          )}
        </>
      )}

      {/* No results after filter */}
      {!loading && !error && reviews.length > 0 && sorted.length === 0 && (
        <p style={{ textAlign: 'center', color: '#aaa', padding: '32px 0' }}>
          No reviews match this filter.
        </p>
      )}
    </section>
  );
};

export default ReviewsSection;
