const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour availability missing Tour ID reference'] // Ensure relation
    },
    date: {
      type: Date,
      required: [true, 'Please provide the availability date']
    },
    totalSlots: {
      type: Number,
      required: [true, 'Please declare total slots for this date']
    },
    bookedSlots: {
      type: Number,
      default: 0
    },
    availableSlots: {
      type: Number,
      required: [true, 'Available slots tracking is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Add compound index on tourId and date for fast single tour availability lookup
availabilitySchema.index({ tourId: 1, date: 1 });

const Availability = mongoose.model('Availability', availabilitySchema);
module.exports = Availability;
