const express = require('express');
const {
  createBooking,
  getUserBookings,
  cancelBooking
} = require('../controllers/booking.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const { check } = require('express-validator');
const router = express.Router();
const { handleValidationErrors } = require('../middlewares/validation.middleware');

// ALL paths necessitate user validation constraints natively globally
router.use(protect);
router.use(authorizeRoles('user'));

router.post(
  '/',
  [
    check('tourId', 'Tour selection is required').not().isEmpty(),
    check('availabilityId', 'Availability selection is required').not().isEmpty(),
    check('slotsBooked').isInt({ min: 1 }),
    handleValidationErrors
  ],
  createBooking
);
router.get('/my-bookings', getUserBookings);
router.put('/:bookingId/cancel', cancelBooking);

module.exports = router;
