/**
 * Parses a structured Error object (thrown by apiClient) into general and field-specific errors.
 * @param {Error} error - The error object from apiClient.
 * @returns {Object} { general: string | null, fields: Object }
 */
export const parseApiErrors = (error) => {
  if (!error) return { general: 'Something went wrong. Please try again.', fields: {} };

  const response = {
    general: null,
    fields: {}
  };

  // Extract field-level errors if present
  if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    error.errors.forEach((err) => {
      if (err.field) {
        // Map the message to the field name
        response.fields[err.field] = err.message;
      }
    });

    // If there's a specific summary message, use it; otherwise provide a default
    response.general = error.message || 'Please correct the highlighted errors.';
  } else {
    // If no field errors, the whole message is general
    response.general = error.message || 'An unexpected error occurred.';
  }

  return response;
};

/**
 * Returns the error message for a specific field if it exists.
 */
export const getFieldError = (fieldErrors, fieldName) => {
  return fieldErrors && fieldErrors[fieldName] ? fieldErrors[fieldName] : null;
};
