import React, { useState } from 'react';
import { SmilePlus, Meh, Frown } from 'lucide-react';
import StarRating from './StarRating';
import { formatRelativeTime } from '../utils/formatDate';
import '../styles/reviews.css';

const getSentimentBadge = (sentiment) => {
  const s = sentiment ? sentiment.toLowerCase() : 'pending';
  if (s === 'positive') return { icon: <SmilePlus size={14}/>, text: 'Positive', color: 'var(--ag-success)', bg: 'rgba(34,197,94,0.1)' };
  if (s === 'negative') return { icon: <Frown size={14}/>, text: 'Negative', color: 'var(--ag-error)', bg: 'rgba(239,68,68,0.1)' };
  if (s === 'neutral')  return { icon: <Meh size={14}/>, text: 'Neutral', color: 'var(--ag-text-muted)', bg: 'var(--ag-bg)' };
  return { icon: null, text: 'Analyzing...', color: '#999', bg: 'transparent' };
};

const MAX_CHARS = 180;

const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    rating = 0,
    comment = '',
    createdAt,
    userId,
    sentiment,
  } = review;

  const authorName = userId?.name || 'Anonymous';
  const initial    = authorName.charAt(0).toUpperCase();

  const isLong    = comment.length > MAX_CHARS;
  const displayed = !expanded && isLong ? comment.slice(0, MAX_CHARS).trimEnd() + '…' : comment;

  const formattedDate = formatRelativeTime(createdAt);

  const badgeObj = getSentimentBadge(sentiment);

  return (
    <article className="ag-review-card">
      {/* Top row — avatar + author */}
      <div className="ag-review-card__top">
        <div className="ag-review-card__avatar" aria-hidden="true">{initial}</div>
        <div>
          <p className="ag-review-card__author">{authorName}</p>
          <p className="ag-review-card__verified">✓ Verified Traveller</p>
        </div>
      </div>

      {/* Mid row — stars + date */}
      <div className="ag-review-card__mid" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <StarRating rating={rating} size="sm" />
        <span className="ag-sentiment-badge" style={{ color: badgeObj.color, background: badgeObj.bg }}>
           {badgeObj.icon} {badgeObj.text}
        </span>
        {formattedDate && (
          <span className="ag-review-card__date" style={{ marginLeft: 'auto' }}>{formattedDate}</span>
        )}
      </div>

      {/* Comment */}
      <p className="ag-review-card__comment">
        {displayed}
        {isLong && (
          <button
            className="ag-review-read-more"
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </p>
    </article>
  );
};

export default ReviewCard;
