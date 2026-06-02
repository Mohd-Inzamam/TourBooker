import React from 'react';
import { Loader2 } from 'lucide-react';
import '../styles/components.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  ...props 
}) => {
  return (
    <button 
      className={`ag-btn ag-btn-${variant} ${isLoading ? 'ag-btn-loading' : ''} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="ag-btn-spinner">
          <Loader2 className="ag-spinner" size={18} />
        </span>
      )}
      <span className={`ag-btn-text ${isLoading ? 'ag-opacity-0' : ''}`}>
        {children}
      </span>
    </button>
  );
};
