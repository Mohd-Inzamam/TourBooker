const express = require('express');
const { 
  getOperatorStats, 
  getPlatformStats, 
  getTourSentimentAnalytics, 
  getPlatformSentimentOverview,
  getOperatorActivities,
  getOperatorUserDetail
} = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

// Strict fallback limiting mapping boundaries outward globally
router.use(protect);

// Operator Analytics Route limit mapped accurately
router.get('/dashboard', authorizeRoles('operator'), getOperatorStats);
router.get('/activities', authorizeRoles('operator'), getOperatorActivities);
router.get('/users/:id', authorizeRoles('operator'), getOperatorUserDetail);

// Admin Analytics Platform Routes natively checked mapped limit
router.get('/admin-dashboard', authorizeRoles('admin'), getPlatformStats);

// AI Sentiment Analytic Endpoints precisely mapped bounding capabilities globally seamlessly 
router.get('/sentiment/tours', authorizeRoles('operator'), getTourSentimentAnalytics);
router.get('/sentiment/platform', authorizeRoles('admin'), getPlatformSentimentOverview);

module.exports = router;
