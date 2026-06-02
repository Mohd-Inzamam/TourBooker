const express = require('express');
const { check } = require('express-validator');
const {
  addReview,
  getTourReviews,
  getTourSentimentSummary
} = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

const router = express.Router();

// Allow public fetching mapped by IDs 
router.get('/:tourId/sentiment-summary', getTourSentimentSummary);
router.get('/:tourId', getTourReviews);

// Limit modification explicitly to Users 
router.use(protect);
router.use(authorizeRoles('user'));

router.post(
  '/add-review',
  [
    check('rating', 'Rating must be a whole number between 1 and 5').isInt({ min: 1, max: 5 }),
    check('comment', 'Review must be between 10 and 500 characters').trim().isLength({ min: 10, max: 500 }),
    handleValidationErrors
  ],
  addReview
);

module.exports = router;
