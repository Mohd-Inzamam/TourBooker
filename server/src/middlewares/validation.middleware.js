const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator errors consistently.
 * Extracts messages and field names into a standardized array.
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path, // In express-validator 7+, it's 'path' instead of 'param'
        message: err.msg
      }))
    });
  }
  next();
};
