const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A tour must belong to an operator']
    },
    title: {
      type: String,
      required: [true, 'Please provide a tour title']
    },
    description: {
      type: String,
      required: [true, 'Please provide a tour description']
    },
    price: {
      type: Number,
      required: [true, 'Please provide a simple tour price']
    },
    ratingAverage: {
      type: Number,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    coordinates: {
      lng: { type: Number },
      lat: { type: Number }
    },
    city: { type: String },
    country: { type: String },
    images: {
      type: [String],
      default: []
    },
    inclusions: {
      type: [String],
      default: []
    },
    exclusions: {
      type: [String],
      default: []
    },
    itinerary: {
      type: [String],
      default: []
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

// Add individual indexes for optimized searching and sorting
tourSchema.index({ price: 1 });
tourSchema.index({ ratingAverage: -1 });
tourSchema.index({ locationId: 1 });
tourSchema.index({ categoryId: 1 });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
