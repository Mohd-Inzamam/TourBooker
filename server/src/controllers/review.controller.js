const mongoose = require('mongoose');
const Review = require('../models/review.model');
const Booking = require('../models/booking.model');
const Tour = require('../models/tour.model');
const SentimentResult = require('../models/sentimentResult.model');
const { analyzeSentiment } = require('../services/ai.service');

exports.addReview = async (req, res) => {
  try {
    const { tourId, rating, reviewText, comment } = req.body;
    const finalReviewText = String(reviewText || comment || '').trim();
    const userId = req.user.id;

    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a whole number between 1 and 5' });
    }
    if (finalReviewText.length < 10 || finalReviewText.length > 500) {
      return res.status(400).json({ success: false, message: 'Review must be between 10 and 500 characters' });
    }

    const tour = await Tour.findById(tourId).select('operatorId');
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found' });
    }
    if (tour.operatorId?.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot review your own tour' });
    }

    // 1) Verify user has completed booking for this tour
    const booking = await Booking.findOne({
      userId,
      tourId,
      status: 'confirmed',
      bookingDate: { $lt: new Date() }
    });
    if (!booking) {
      return res.status(403).json({
        success: false,
        message: 'You can only review tours you have completed'
      });
    }

    // 2) Prevent duplicate reviews per user for this tour
    const existingReview = await Review.findOne({ userId, tourId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this tour'
      });
    }

    // 3) Create review
    const review = await Review.create({
      userId,
      tourId,
      bookingId: booking._id,
      rating: Number(rating),
      reviewText: finalReviewText
    });

    // 4) Recalculate tour aggregate rating
    const stats = await Review.aggregate([
      { $match: { tourId: new mongoose.Types.ObjectId(tourId) } },
      { $group: { _id: '$tourId', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);

    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingCount: stats[0].nRating,
        ratingAverage: Math.round(stats[0].avgRating * 10) / 10
      });
    }

    // 5) Run AI sentiment analysis non-blocking
    analyzeSentiment(finalReviewText)
      .then(async (sentimentData) => {
        await Review.findByIdAndUpdate(review._id, {
          sentiment: sentimentData.sentiment,
          sentimentScore: sentimentData.sentimentScore,
          sentimentConfidence: sentimentData.confidence,
          sentimentAnalyzedAt: new Date()
        });
        await SentimentResult.recalculateForTour(tourId);
      })
      .catch(console.error);

    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to submit review' });
  }
};

exports.getTourReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tourId: req.params.tourId })
      .populate({ path: 'userId', select: 'name' })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      results: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch reviews' });
  }
};

exports.getTourSentimentSummary = async (req, res) => {
  try {
    const result = await SentimentResult.findOne({ tourId: req.params.tourId });
    if (!result) {
      return res.status(200).json({
        success: true,
        data: { positiveCount: 0, neutralCount: 0, negativeCount: 0, averageSentimentScore: 0, totalAnalyzed: 0 }
      });
    }
    const totalAnalyzed = result.positiveCount + result.neutralCount + result.negativeCount;
    res.status(200).json({
      success: true,
      data: {
        positiveCount: result.positiveCount,
        neutralCount: result.neutralCount,
        negativeCount: result.negativeCount,
        averageSentimentScore: result.averageSentimentScore,
        totalAnalyzed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch sentiment summary' });
  }
};
