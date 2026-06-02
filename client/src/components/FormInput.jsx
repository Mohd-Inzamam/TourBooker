import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import '../styles/components.css';

export const FormInput = ({ 
  label, 
  type = 'text', 
  error, 
  className = '', 
  id,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`ag-input-wrapper ${className}`}>
      {label && <label htmlFor={inputId} className="ag-label">{label}</label>}
      <div className="ag-input-container">
        <input 
          id={inputId}
          type={inputType} 
          className={`ag-input ${error ? 'ag-input-error' : ''} ${isPassword ? 'ag-input-pwd' : ''}`}
          {...props}
        />
        {isPassword && (
          <button 
            type="button" 
            className="ag-pwd-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span className="ag-error-msg">
          <AlertCircle size={14} />
          {error}
        </span>
      )}
    </div>
  );
};
