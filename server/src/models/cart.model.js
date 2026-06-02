const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  availabilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Availability', required: true },
  slotsBooked: { type: Number, required: true, min: 1 },
  pricePerSlot: { type: Number, required: true },
  basePricePerSlot: { type: Number },
  addedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    lastActivityAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

cartSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 604800 });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
