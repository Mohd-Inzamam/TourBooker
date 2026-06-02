const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    reviewText: {
      type: String,
      required: [true, 'Review cannot be empty!']
    },
    sentiment: { 
      type: String, 
      enum: ['positive', 'neutral', 'negative', 'pending'],
      default: 'pending'
    },
    sentimentScore: { type: Number },
    sentimentConfidence: { type: Number },
    sentimentAnalyzedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

// Index for performantly retrieving all tour reviews immediately outward
reviewSchema.index({ tourId: 1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
