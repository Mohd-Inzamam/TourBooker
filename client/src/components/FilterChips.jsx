import React from 'react';
import '../styles/components.css';

export const FilterChips = ({ 
  options = ['Adventure', 'Luxury', 'Budget', 'Nature', 'Culture'], 
  selected = [], 
  onChange,
  className = ''
}) => {
  const toggleSelection = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={`ag-filter-chips ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          className={`ag-chip ${selected.includes(option) ? 'ag-chip-active' : ''}`}
          onClick={() => toggleSelection(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
