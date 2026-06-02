import React from 'react';
import { AlertCircle } from 'lucide-react';
import './FormError.css';

/**
 * Reusable error display component with 'field' and 'general' variations.
 */
export const FormError = ({ message, type = 'field' }) => {
  if (!message) return null;

  if (type === 'general') {
    return (
      <div className="ag-form-error-general" role="alert">
        <AlertCircle size={18} className="ag-error-icon-general" />
        <span className="ag-error-text-general">{message}</span>
      </div>
    );
  }

  return (
    <div className="ag-field-error-wrapper" role="alert">
      <AlertCircle size={12} className="ag-error-icon-field" />
      <span className="ag-field-error-text">{message}</span>
    </div>
  );
};
