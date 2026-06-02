const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema(
  {
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['seasonal', 'demand', 'dayofweek', 'earlybird', 'lastminute'], required: true },
    adjustmentType: { type: String, enum: ['percentage', 'fixed'], required: true },
    adjustmentValue: { type: Number, required: true },
    conditions: {
      daysOfWeek: [Number],
      dateFrom: Date,
      dateTo: Date,
      minDaysBeforeBooking: Number,
      maxDaysBeforeBooking: Number,
      minBookingsThreshold: Number
    },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
