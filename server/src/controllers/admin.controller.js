const mongoose = require('mongoose');
const User = require('../models/user.model');
const Operator = require('../models/operator.model');
const Tour = require('../models/tour.model');
const Booking = require('../models/booking.model');
const Review = require('../models/review.model');
const AdminLog = require('../models/adminLog.model');
const { sendEmail } = require('../config/mailer');
const { operatorApprovedEmail, operatorRejectedEmail } = require('../utils/emailTemplates');

const logAdminAction = async (adminId, action, targetType, targetId) => {
  try {
    await AdminLog.create({ adminId, action, targetType, targetId });
  } catch (err) {
    console.error('Admin log failed:', err.message);
  }
};

exports.approveOperator = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid operator ID format' });
    }

    const operator = await Operator.findById(req.params.id).populate('userId');
    if (!operator) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }

    const isApproved = req.body.isApproved !== false;
    const reason = req.body.reason || '';

    // Update operator profile
    operator.isApproved = isApproved;
    await operator.save();

    // Update user profile
    const user = await User.findById(operator.userId._id);
    if (user) {
      user.isApproved = isApproved;
      if (isApproved) {
        user.isActive = true;
      }
      await user.save();
    }

    // Activate/deactivate all operator's tours
    if (isApproved) {
      await Tour.updateMany(
        { operatorId: operator.userId._id },
        { isActive: true }
      );
    } else {
      await Tour.updateMany(
        { operatorId: operator.userId._id },
        { isActive: false }
      );
    }

    await logAdminAction(req.user.id, isApproved ? 'Approve Operator' : 'Reject Operator', 'operator', operator._id);

    if (operator.userId) {
      if (isApproved) {
        sendEmail({
          to: operator.userId.email,
          subject: 'Your Operator Account is Approved! ✅',
          html: operatorApprovedEmail({ operatorName: operator.userId.name })
        }).catch(console.error);
      } else {
        sendEmail({
          to: operator.userId.email,
          subject: 'Update on Your Operator Application',
          html: operatorRejectedEmail({ operatorName: operator.userId.name, reason })
        }).catch(console.error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Operator ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: { operator }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update operator status' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users, total: users.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: false }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAdminAction(req.user.id, 'Deactivate User', 'user', user._id);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate user' });
  }
};

exports.removeTour = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid tour ID format' });
    }

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: false }
    );

    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found' });
    }

    await logAdminAction(req.user.id, 'Deactivate Tour', 'tour', tour._id);

    res.status(200).json({
      success: true,
      message: 'Tour deactivated successfully',
      data: { tour }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to remove tour' });
  }
};

exports.getAllOperators = async (req, res) => {
  try {
    const operators = await Operator.find()
      .populate({ path: 'userId', select: 'name email isActive role' })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      message: 'Operators retrieved successfully',
      data: { operators, total: operators.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch operators' });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const bookings = await Booking.find({ userId: req.params.id }).populate('tourId').sort('-createdAt');
    const reviews = await Review.find({ userId: req.params.id }).populate('tourId').sort('-createdAt');

    res.status(200).json({
      success: true,
      data: { user, bookings, reviews }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOperatorDetail = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id).populate('userId', '-password');
    if (!operator) return res.status(404).json({ success: false, message: 'Operator not found' });

    const tours = await Tour.find({ operatorId: operator.userId._id });
    const tourIds = tours.map(t => t._id);

    const bookings = await Booking.find({ tourId: { $in: tourIds } }).sort('-createdAt');
    const reviews = await Review.find({ tourId: { $in: tourIds } }).populate('userId', 'name').sort('-createdAt');

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        operator,
        tours,
        bookings: bookings.slice(0, 5), // Recent bookings
        reviews: reviews.slice(0, 10),
        stats: {
          totalTours: tours.length,
          totalBookings: bookings.length,
          totalRevenue
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Switch role
    user.role = 'admin';
    await user.save();

    // If they were an operator, remove the operator document
    await Operator.findOneAndDelete({ userId: user._id });

    await logAdminAction(req.user.id, 'Promote to Admin', 'user', user._id);

    res.status(200).json({
      success: true,
      message: `${user.name} has been promoted to Admin and Operator status removed.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate('adminId', 'name')
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
