const Booking = require('../models/booking.model');
const Tour = require('../models/tour.model');
const Availability = require('../models/availability.model');
const User = require('../models/user.model');
const { sendEmail } = require('../config/mailer');
const { bookingCancellationEmail } = require('../utils/emailTemplates');

exports.createBooking = async (req, res) => {
  try {
    const { tourId, availabilityId, slotsBooked } = req.body;
    const normalizedSlots = Number(slotsBooked);
    if (!Number.isInteger(normalizedSlots) || normalizedSlots < 1) {
      return res.status(400).json({ success: false, message: 'slotsBooked must be a positive integer' });
    }

    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });

    if (tour.operatorId?.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot book your own tour' });
    }

    const availability = await Availability.findById(availabilityId);

    if (!availability || availability.tourId.toString() !== tourId.toString()) {
      return res.status(404).json({ success: false, message: 'Availability record not found for this tour' });
    }

    const now = new Date();
    if (new Date(availability.date) < now) {
      return res.status(400).json({ success: false, message: 'Cannot book a past date' });
    }

    const availableSlots = availability.availableSlots;
    if (availableSlots < normalizedSlots) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableSlots} slot(s) remaining for this date`
      });
    }

    const totalPrice = tour.price * normalizedSlots;

    // Atomic update to prevent race conditions
    const updatedAvailability = await Availability.findOneAndUpdate(
      {
        _id: availabilityId,
        availableSlots: { $gte: normalizedSlots }
      },
      { $inc: { bookedSlots: normalizedSlots, availableSlots: -normalizedSlots } },
      { new: true }
    );

    if (!updatedAvailability) {
      return res.status(400).json({ success: false, message: 'Slots are no longer available. Please try again.' });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      tourId,
      availabilityId,
      bookingDate: availability.date,
      slotsBooked: normalizedSlots,
      totalPrice
    });

    res.status(201).json({ success: true, data: { booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create booking' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('tourId')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch bookings' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This booking is already cancelled' });
    }

    const currentDate = new Date();
    if (new Date(booking.bookingDate) <= currentDate) {
      return res.status(400).json({ success: false, message: 'Past bookings cannot be cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    await Availability.findByIdAndUpdate(
      booking.availabilityId,
      { $inc: { bookedSlots: -booking.slotsBooked, availableSlots: +booking.slotsBooked } }
    );

    const user = await User.findById(booking.userId);
    const tour = await Tour.findById(booking.tourId);
    if (user && tour) {
      sendEmail({
        to: user.email,
        subject: 'Booking Cancellation Confirmed',
        html: bookingCancellationEmail({
          userName: user.name,
          tourTitle: tour.title,
          bookingDate: booking.bookingDate,
          totalPrice: booking.totalPrice,
          refundNote: 'If you paid online, refund will be processed within 5-7 business days.'
        })
      }).catch(console.error);
    }

    res.status(200).json({ success: true, data: { booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to cancel booking' });
  }
};
