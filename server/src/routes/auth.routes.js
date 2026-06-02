const express = require('express');
const { check, body } = require('express-validator');
const {
  registerUser,
  registerOperator,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .matches(/^[a-zA-ZÀ-ÿ\s'\-]+$/)
      .withMessage('Name can only contain letters and spaces')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters and include a letter and a number')
      .matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .isLength({ max: 72 }),
    check('role', 'Invalid role selected').optional().isIn(['user', 'operator', 'admin']),
    handleValidationErrors
  ],
  registerUser
);

// POST /api/auth/register-operator
router.post(
  '/register-operator',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .matches(/^[a-zA-ZÀ-ÿ\s'\-]+$/)
      .withMessage('Name can only contain letters and spaces')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters and include a letter and a number')
      .matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .isLength({ max: 72 }),
    check('companyName', 'Company name is required').not().isEmpty(),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    handleValidationErrors
  ],
  registerOperator
);

// POST /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    handleValidationErrors
  ],
  loginUser
);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PUT /api/auth/profile
router.put('/profile', protect, updateProfile);

// PUT /api/auth/change-password
router.put('/change-password', protect, changePassword);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;
