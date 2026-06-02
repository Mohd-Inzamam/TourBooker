const mongoose = require('mongoose');

const demoPaymentIntentSchema = new mongoose.Schema({
  paymentIntentId: { type: String, unique: true, required: true },
  clientSecret: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  metadata: { type: Object, default: {} },
  status: {
    type: String,
    enum: ['requires_payment_method', 'succeeded', 'failed'],
    default: 'requires_payment_method'
  },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

module.exports = mongoose.model('DemoPaymentIntent', demoPaymentIntentSchema);
