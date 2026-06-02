const express = require('express');
const { check } = require('express-validator');
const {
  createTour,
  updateTour,
  deleteTour,
  addAvailability,
  getAllTours,
  getMyTours,
  getTourDetails,
  getTourAvailability,
  manualGeocodeTour
} = require('../controllers/tour.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

const router = express.Router();

// ── PUBLIC & SPECIFIC routes ─────────────────────────────────────
router.get('/', getAllTours);
router.get('/my-tours', protect, authorizeRoles('operator'), getMyTours);
router.get('/:tourId', getTourDetails);
router.get('/:tourId/availability', getTourAvailability);

// ── PROTECTED routes — operator actions only ──────────────────────
router.use(protect);
router.use(authorizeRoles('operator'));

router.post(
  '/',
  [
    check('title').trim().notEmpty().isLength({ min: 5, max: 100 }),
    check('description').trim().notEmpty().isLength({ min: 20, max: 2000 }),
    check('price', 'Price must be a positive number').isFloat({ min: 1, max: 999999 }),
    check('duration').optional().isInt({ min: 1 }),
    check('maxGroupSize').optional().isInt({ min: 1, max: 500 }),
    check('images').optional().isArray({ max: 5 }),
    handleValidationErrors
  ],
  createTour
);

router.put(
  '/:tourId',
  [
    check('title').optional().trim().isLength({ min: 5, max: 100 }),
    check('description').optional().trim().isLength({ min: 20, max: 2000 }),
    check('price', 'Price must be a positive number').optional().isFloat({ min: 1, max: 999999 }),
    check('duration').optional().isInt({ min: 1 }),
    check('maxGroupSize').optional().isInt({ min: 1, max: 500 }),
    check('images').optional().isArray({ max: 5 }),
    handleValidationErrors
  ],
  updateTour
);

router.put('/:tourId/geocode', manualGeocodeTour);

router.delete('/:tourId', deleteTour);

router.post(
  '/:tourId',
  [
    check('date', 'Valid date is required').isISO8601(),
    check('totalSlots').isInt({ min: 1, max: 500 }),
    check('priceOverride').optional().isFloat({ min: 0.01 }),
    handleValidationErrors
  ],
  addAvailability
);

module.exports = router;
