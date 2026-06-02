const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: true
    },
    availabilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Availability',
      required: true
    },
    bookingDate: {
      type: Date,
      required: true
    },
    slotsBooked: {
      type: Number,
      required: true,
      min: 1
    },
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed'
    },
    paymentIntentId: {
      type: String
    },
    basePricePerSlot: { type: Number },
    finalPricePerSlot: { type: Number },
    appliedPricingRule: { type: String },
    promoCodeUsed: { type: String },
    promoDiscount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// Add lookup indices for frequently queried references 
bookingSchema.index({ userId: 1 });
bookingSchema.index({ tourId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
