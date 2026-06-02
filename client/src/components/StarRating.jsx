import React, { useState } from 'react';
import '../styles/reviews.css';

/**
 * StarRating — dual-mode star component
 *
 * Display mode:  <StarRating rating={4.2} size="md" />
 * Input mode:    <StarRating interactive value={3} onChange={setRating} size="md" />
 */
const SIZE_MAP = { sm: 16, md: 22, lg: 32 };

const StarRating = ({ rating = 0, value, onChange, interactive = false, size = 'md' }) => {
  const [hovered, setHovered] = useState(0);
  const px = SIZE_MAP[size] || 22;

  // ── Interactive (input) mode ──────────────────────────────
  if (interactive) {
    const selected = value || 0;
    return (
      <div
        className="ag-stars"
        role="radiogroup"
        aria-label="Star rating"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= (hovered || selected);
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === selected}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              className={`ag-star ag-star--interactive ${isFilled ? 'ag-star--filled' : ''} ${hovered >= star ? 'ag-star--hover' : ''}`}
              style={{ fontSize: px, background: 'none', border: 'none', padding: '1px' }}
              onMouseEnter={() => setHovered(star)}
              onClick={() => onChange && onChange(star)}
            >
              {isFilled ? '★' : '☆'}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Display (read-only) mode ──────────────────────────────
  return (
    <div className="ag-stars" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map(star => {
        let cls = 'ag-star';
        if (star <= Math.floor(rating)) {
          cls += ' ag-star--filled';       // fully filled
        } else if (star - 0.5 <= rating) {
          cls += ' ag-star--filled';       // half — treat as filled visually
        }
        return (
          <span
            key={star}
            className={cls}
            style={{ fontSize: px }}
            aria-hidden="true"
          >
            {star - 0.5 <= rating ? '★' : '☆'}
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
