import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import StarRating from './StarRating';
import { Button, FormError } from './';
import { submitReview } from '../services/review.service';
import { parseApiErrors } from '../utils/formErrors';
import '../styles/reviews.css';

const MIN_COMMENT = 20;
const MAX_COMMENT = 500;

/**
 * WriteReviewForm
 * Props:
 *   tourId           — string
 *   existingReviews  — array of review objects (to detect duplicate)
 *   onReviewSubmitted — callback called after successful submit
 */
const WriteReviewForm = ({ tourId, existingReviews = [], onReviewSubmitted }) => {
  const navigate    = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // ── Guard: not logged in ──────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="ag-review-guest-cta">
        <p>Sign in to share your experience with other travellers</p>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }

  // ── Guard: only users (not operators/admins) can review ───
  if (user?.role !== 'user') return null;

  // ── Guard: already reviewed ───────────────────────────────
  const alreadyReviewed = existingReviews.some(
    r => r.userId?._id === user?._id || r.userId === user?._id
  );
  if (alreadyReviewed) {
    return (
      <div className="ag-review-already">
        <span>✓</span>
        <span>You've already reviewed this tour</span>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────
  if (success) {
    return (
      <div className="ag-review-success">
        <span>✓</span>
        <span>Review submitted! Thank you for your feedback.</span>
      </div>
    );
  }

  // ── Submit handler ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientSideFields = {};

    if (!rating) {
      clientSideFields.rating = 'Please select a rating';
    }

    if (comment.trim().length < MIN_COMMENT) {
      clientSideFields.comment = `Review must be at least ${MIN_COMMENT} characters.`;
    }

    if (Object.keys(clientSideFields).length > 0) {
      setFieldErrors(clientSideFields);
      return;
    }

    setLoading(true);
    setGeneralError('');
    setFieldErrors({});
    try {
      await submitReview(tourId, { rating, comment: comment.trim() });
      setSuccess(true);
      onReviewSubmitted?.();
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      setFieldErrors(fields);
      setGeneralError(general || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const charCount  = comment.length;
  const countClass = charCount > MAX_COMMENT - 40 ? 'warn' : '';

  return (
    <div className="ag-review-form-wrap">
      <h3 className="ag-review-form-title">Share Your Experience</h3>

      <form onSubmit={handleSubmit} noValidate>
        {/* Star selector */}
        <div style={{ marginBottom: '20px' }}>
          <label className="ag-review-form-label">Your Rating</label>
          <StarRating interactive value={rating} onChange={v => { setRating(v); if (fieldErrors.rating) setFieldErrors(prev => { const n = {...prev}; delete n.rating; return n;}); }} size="lg" />
          {fieldErrors.rating && <FormError message={fieldErrors.rating} />}
        </div>

        {/* Comment */}
        <div style={{ marginBottom: '20px' }}>
          <label className="ag-review-form-label" htmlFor="ag-review-comment">Your Review</label>
          <textarea
            id="ag-review-comment"
            className={`ag-review-textarea ${fieldErrors.comment ? 'error' : ''}`}
            placeholder="Tell other travellers about your experience..."
            value={comment}
            maxLength={MAX_COMMENT}
            onChange={e => { setComment(e.target.value); if (fieldErrors.comment) setFieldErrors(prev => {const n = {...prev}; delete n.comment; return n;}); }}
            rows={5}
          />
          <div className={`ag-review-char-counter ${countClass}`}>
            {charCount} / {MAX_COMMENT}
          </div>
          {fieldErrors.comment && <FormError message={fieldErrors.comment} />}
        </div>
        {generalError && <FormError message={generalError} type="general" />}

        <Button
          type="submit"
          isLoading={loading}
          disabled={loading}
          style={{ width: '100%' }}
        >
          Submit Review
        </Button>
      </form>
    </div>
  );
};

export default WriteReviewForm;
