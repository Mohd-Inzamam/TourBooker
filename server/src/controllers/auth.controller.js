const crypto = require('crypto');
const User = require('../models/user.model');
const Operator = require('../models/operator.model');
const Cart = require('../models/cart.model');
const { generateToken } = require('../utils/jwt');
const { sendEmail } = require('../config/mailer');
const { welcomeEmail, passwordResetEmail } = require('../utils/emailTemplates');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
};

exports.registerUser = async (req, res) => {
  try {
    const normalizedName = String(req.body.name || '').trim();
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const requestedRole = String(req.body.role || 'user').trim().toLowerCase();

    if (!/^[a-zA-ZÀ-ÿ\s'\-]+$/.test(normalizedName) || normalizedName.length < 2 || normalizedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name can only contain letters and spaces',
        errors: [{ field: 'name', message: 'Name can only contain letters and spaces' }]
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please include a valid email',
        errors: [{ field: 'email', message: 'Please include a valid email' }]
      });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password) || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include a letter and a number',
        errors: [{ field: 'password', message: 'Password must be at least 8 characters and include a letter and a number' }]
      });
    }

    if (!['user', 'operator', 'admin'].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected',
        errors: [{ field: 'role', message: 'Invalid role selected' }]
      });
    }

    // Public registration never elevates to admin.
    const safeRole = requestedRole === 'admin' ? 'user' : requestedRole;

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        errors: [{ field: 'email', message: 'An account with this email already exists' }]
      });
    }

    const user = await User.create({ name: normalizedName, email: normalizedEmail, password, role: safeRole });

    sendEmail({
      to: user.email,
      subject: 'Welcome to TourBooker! 👋',
      html: welcomeEmail({ userName: user.name, role: user.role })
    }).catch(console.error);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('registerUser error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

exports.registerOperator = async (req, res) => {
  try {
    const normalizedName = String(req.body.name || '').trim();
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const { password, companyName, phone, address } = req.body;

    if (!/^[a-zA-ZÀ-ÿ\s'\-]+$/.test(normalizedName) || normalizedName.length < 2 || normalizedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name can only contain letters and spaces',
        errors: [{ field: 'name', message: 'Name can only contain letters and spaces' }]
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        errors: [{ field: 'email', message: 'An account with this email already exists' }]
      });
    }

    // Create user with isApproved: false by default
    const user = await User.create({ 
      name: normalizedName, 
      email: normalizedEmail, 
      password, 
      role: 'operator',
      isApproved: false
    });

    await Operator.create({ userId: user._id, companyName, phone, address });

    sendEmail({
      to: user.email,
      subject: 'Welcome to TourBooker! 👋',
      html: welcomeEmail({ userName: user.name, role: user.role })
    }).catch(console.error);

    // Do NOT generate JWT - operator cannot log in until approved
    res.status(201).json({
      success: true,
      message: 'operator_pending',
      data: {
        email: user.email,
        message: 'Your operator account has been created. Please wait for admin approval before logging in. You will receive an email once your account is approved.'
      }
    });
  } catch (error) {
    console.error('registerOperator error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password. Please try again.',
        errors: [
          { field: 'email', message: 'Incorrect email or password. Please try again.' },
          { field: 'password', message: 'Incorrect email or password. Please try again.' }
        ]
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'account_deactivated',
        data: {
          reason: 'Your account has been deactivated. Please contact support.'
        }
      });
    }

    // Check if operator is approved
    if (user.role === 'operator' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'pending_approval',
        data: {
          reason: 'Your operator account is pending admin approval. You will receive an email once approved.'
        }
      });
    }

    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    };

    const token = generateToken(user._id, user.role);
    res.status(200).json({
      success: true,
      token,
      data: { user: responseUser }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let isApproved = undefined;
    if (user.role === 'operator') {
      const operatorProfile = await Operator.findOne({ userId: req.user.id }).select('isApproved');
      isApproved = !!operatorProfile?.isApproved;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let cartCount = 0;
    if (user.role === 'user') {
      const cart = await Cart.findOne({ userId: req.user.id });
      if (cart) cartCount = cart.items.length;
    }

    let unreadMessages = 0;
    try {
      const Conversation = require('../models/conversation.model');
      unreadMessages = await Conversation.countDocuments({
        participants: req.user.id,
        isReadBy: { $ne: req.user.id }
      });
    } catch (_) { /* messaging model may not exist */ }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved,
          isActive: user.isActive,
          createdAt: user.createdAt,
          cartCount,
          messageCount: unreadMessages
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required.',
        errors: [
          ...(!name ? [{ field: 'name', message: 'Name is required' }] : []),
          ...(!email ? [{ field: 'email', message: 'Email is required' }] : [])
        ]
      });
    }

    const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use by another account.',
        errors: [{ field: 'email', message: 'Email is already in use by another account' }]
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required.',
        errors: [
          ...(!currentPassword ? [{ field: 'currentPassword', message: 'Current password is required' }] : []),
          ...(!newPassword ? [{ field: 'newPassword', message: 'New password is required' }] : [])
        ]
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters.',
        errors: [{ field: 'newPassword', message: 'New password must be at least 8 characters' }]
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
        errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }]
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to change password' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Intentionally vague to prevent email enumeration
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link was sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;

    sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: passwordResetEmail({ userName: user.name, resetLink })
    }).catch(console.error);

    res.status(200).json({ success: true, message: 'If that email exists, a reset link was sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to send reset email' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
        errors: [
          ...(!token ? [{ field: 'token', message: 'Reset token is required' }] : []),
          ...(!newPassword ? [{ field: 'newPassword', message: 'New password is required' }] : [])
        ]
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
  }
};