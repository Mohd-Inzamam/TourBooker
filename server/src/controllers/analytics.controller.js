const mongoose = require('mongoose');
const Tour = require('../models/tour.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const Operator = require('../models/operator.model');
const Review = require('../models/review.model');
const SentimentResult = require('../models/sentimentResult.model');

// ==========================================
// OPERATOR ANALYTICS
// ==========================================
exports.getOperatorStats = async (req, res) => {
  try {
    const operatorId = new mongoose.Types.ObjectId(req.user.id);
    
    // 1) Aggregate Tour Statistics (Count & Avg Rating)
    const tourStats = await Tour.aggregate([
      { $match: { operatorId: operatorId } },
      { 
        $group: {
          _id: null,
          totalTours: { $sum: 1 },
          avgRating: { $avg: '$ratingAverage' }
        }
      }
    ]);

    const totalTours = tourStats.length > 0 ? tourStats[0].totalTours : 0;
    const avgRating = tourStats.length > 0 ? tourStats[0].avgRating : 0;

    // 2) Collect all operator's tour ObjectIDs
    const tours = await Tour.find({ operatorId }).select('_id');
    const tourIds = tours.map(t => t._id);

    // 3) Aggregate Booking Statistics 
    const bookingStats = await Booking.aggregate([
      { $match: { tourId: { $in: tourIds } } },
      { 
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const totalBookings = bookingStats.length > 0 ? bookingStats[0].totalBookings : 0;
    const totalRevenue = bookingStats.length > 0 ? bookingStats[0].totalRevenue : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalTours,
        totalBookings,
        totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10 // Rounded elegantly
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// ADMIN PLATFORM ANALYTICS 
// ==========================================
exports.getPlatformStats = async (req, res) => {
  try {
    // 1) Execute high-performance parallel count mechanisms mappings natively
    const [totalUsers, totalOperators, totalTours, totalBookings] = await Promise.all([
      User.countDocuments(),
      Operator.countDocuments(),
      Tour.countDocuments(),
      Booking.countDocuments()
    ]);

    // 2) Determine Most Booked Tours limits computationally through aggregations
    // Groups bookings explicitly counting documents matching bounded IDs!
    const topToursStats = await Booking.aggregate([
      { 
        $group: {
          _id: '$tourId',
          bookingsCount: { $sum: 1 } // Metric checking gross interactions
        }
      },
      { $sort: { bookingsCount: -1 } }, // Descending 
      { $limit: 5 } // Top 5
    ]);

    // 3) Populate explicit UI-ready details back natively into returned array objects
    const populatedTours = await Tour.populate(topToursStats, { 
      path: '_id', 
      select: 'title price ratingAverage' 
    });

    const topTours = populatedTours.map(t => ({
      tour: t._id,
      bookingsCount: t.bookingsCount
    }));

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalOperators,
        totalTours,
        totalBookings,
        topTours
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ==========================================
// SENTIMENT ANALYTICS
// ==========================================
exports.getTourSentimentAnalytics = async (req, res) => {
  try {
    const operatorId = new mongoose.Types.ObjectId(req.user.id);
    const tours = await Tour.find({ operatorId }).select('_id title');
    const tourIds = tours.map(t => t._id);

    const sentiments = await SentimentResult.find({ tourId: { $in: tourIds } })
      .populate('tourId', 'title');

    const mapped = sentiments.map(s => {
      const total = s.positiveCount + s.neutralCount + s.negativeCount;
      const ratio = total > 0 ? (s.positiveCount / total) * 100 : 0;
      return { ...s.toObject(), sentimentRatio: ratio, totalReviews: total };
    });

    mapped.sort((a, b) => b.sentimentRatio - a.sentimentRatio);

    res.status(200).json({ status: 'success', data: mapped });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getPlatformSentimentOverview = async (req, res) => {
  try {
    const sentiments = await SentimentResult.find().populate('tourId', 'title');

    let totalPositive = 0;
    let totalNeutral = 0;
    let totalNegative = 0;
    let totalScore = 0;

    const mapped = sentiments.map(s => {
      totalPositive += s.positiveCount;
      totalNeutral += s.neutralCount;
      totalNegative += s.negativeCount;
      const total = s.positiveCount + s.neutralCount + s.negativeCount;
      const ratio = total > 0 ? (s.positiveCount / total) * 100 : 0;
      totalScore += s.averageSentimentScore * total; // Re-weight
      return { tour: s.tourId, score: s.averageSentimentScore, ratio, total };
    }).filter(m => m.total > 0);

    const platformTotal = totalPositive + totalNeutral + totalNegative;
    const overallScore = platformTotal > 0 ? totalScore / platformTotal : 0;

    mapped.sort((a, b) => b.score - a.score);
    const topPositive = mapped.slice(0, 5);
    
    mapped.sort((a, b) => a.score - b.score);
    const topNegative = mapped.slice(0, 5);

    res.status(200).json({
      status: 'success',
      data: {
        totalPositive,
        totalNeutral,
        totalNegative,
        overallScore,
        topPositive,
        topNegative
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getOperatorActivities = async (req, res) => {
  try {
    const operatorId = new mongoose.Types.ObjectId(req.user.id);
    const tours = await Tour.find({ operatorId }).select('_id');
    const tourIds = tours.map(t => t._id);

    // 1) Get recent bookings for my tours
    const bookings = await Booking.find({ tourId: { $in: tourIds } })
      .populate('userId', 'name')
      .populate('tourId', 'title')
      .sort('-createdAt')
      .limit(10);

    // 2) Get recent reviews for my tours
    const reviews = await Review.find({ tourId: { $in: tourIds } })
      .populate('userId', 'name')
      .populate('tourId', 'title')
      .sort('-createdAt')
      .limit(10);

    // Merge and sort
    const activities = [
      ...bookings.map(b => ({
        type: 'booking',
        description: `New booking from ${b.userId?.name || 'Guest'} for ${b.tourId?.title}`,
        createdAt: b.createdAt
      })),
      ...reviews.map(r => ({
        type: 'review',
        description: `${r.userId?.name || 'Guest'} left a ${r.rating}★ review on ${r.tourId?.title}`,
        createdAt: r.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15);

    res.status(200).json({ status: 'success', data: activities });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getOperatorUserDetail = async (req, res) => {
  try {
    const operatorId = new mongoose.Types.ObjectId(req.user.id);
    const targetUserId = req.params.id;
    
    const tours = await Tour.find({ operatorId }).select('_id');
    const tourIds = tours.map(t => t._id);

    const user = await User.findById(targetUserId).select('name email createdAt');
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const bookings = await Booking.find({ 
      userId: targetUserId,
      tourId: { $in: tourIds }
    }).populate('tourId', 'title').sort('-createdAt');

    const stats = {
      totalBookings: bookings.length,
      totalSpent: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    };

    res.status(200).json({ 
      status: 'success', 
      data: { user, bookings, stats } 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
