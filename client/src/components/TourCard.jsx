import React from 'react';
import { Star, Clock, MapPin } from 'lucide-react';
import { Button } from './Button';
import '../styles/components.css';

export const TourCard = ({ 
  image, 
  title, 
  location,
  price, 
  rating, 
  reviews, 
  onViewDetails,
  className = '' 
}) => {
  return (
    <div className={`ag-tour-card ${className}`}>
      <div className="ag-card-image">
        <img
          src={image || 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?q=80&w=600&auto=format&fit=crop'}
          alt={title}
          loading="lazy"
          onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?q=80&w=600&auto=format&fit=crop'; }}
        />
        <div className="ag-card-price">
          <span className="ag-card-price-value">₹{price}</span>
        </div>
        <div className="ag-card-rating">
          <Star className="ag-star-icon" size={14} fill="currentColor" />
          <span className="ag-rating-val">{rating}</span>
        </div>
      </div>
      <div className="ag-card-content">
        <div className="ag-card-meta">
          {/* FIX 3: duration removed — field does not exist in Tour schema */}
          <span className="ag-card-meta-item"><MapPin size={14} /> <span>{location || 'Global'}</span></span>
        </div>
        <h3 className="ag-card-title" title={title}>{title}</h3>
        <p className="ag-card-reviews">{reviews} verified reviews</p>
        
        <div className="ag-card-footer">
          <Button variant="primary" className="ag-card-action" onClick={onViewDetails}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};
