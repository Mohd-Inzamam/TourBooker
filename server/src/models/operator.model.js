const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    companyName: {
      type: String,
      required: [true, 'Please add a company name']
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number']
    },
    address: {
      type: String,
      required: [true, 'Please add an address']
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Operator = mongoose.model('Operator', operatorSchema);
module.exports = Operator;
