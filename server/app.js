const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// 1. GLOBAL MIDDLEWARES
// Enable CORS
app.use(cors());

// IMPORTANT: Webhook needs raw body parsed BEFORE express.json handles typical requests
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', {
    skip: (req) => req.originalUrl.includes('reset-password')
  }));
}

// 2. ROUTES
// Basic default route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Tours & Activity Booking Marketplace API'
  });
});

// Route handlers
// Route handlers
// Route handlers
const authRouter = require('./src/routes/auth.routes');
const tourRouter = require('./src/routes/tour.routes');
const bookingRouter = require('./src/routes/booking.routes');
const reviewRouter = require('./src/routes/review.routes');
const adminRouter = require('./src/routes/admin.routes');
const analyticsRouter = require('./src/routes/analytics.routes');
const aiRouter = require('./src/routes/ai.routes');
const uploadRouter = require('./src/routes/upload.routes');
const paymentRouter = require('./src/routes/payment.routes');
const cartRouter = require('./src/routes/cart.routes');
const pricingRouter = require('./src/routes/pricing.routes');
const messagingRouter = require('./src/routes/messaging.routes');
const notificationRouter = require('./src/routes/notification.routes');
const locationRouter = require('./src/routes/location.routes');

app.use('/api/auth', authRouter);
app.use('/api/tours', tourRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/cart', cartRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/messages', messagingRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/locations', locationRouter);

// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);

// 3. UNHANDLED ROUTES HANDLER
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// 4. GLOBAL ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Mongoose/MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      errors: [{ field, message: `This ${field} is already in use` }]
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
