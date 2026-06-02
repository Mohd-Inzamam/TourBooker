const express = require('express');
const router = express.Router();
const { searchPlaces, geocodeAddress } = require('../services/geocoding.service');
const { protect } = require('../middlewares/auth.middleware');

// Simple Rate Limiter (1 request per second per IP)
const rateLimitCache = new Map();
const strictRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const lastRequest = rateLimitCache.get(ip);
  if (lastRequest && now - lastRequest < 1000) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please wait 1 second.' });
  }
  rateLimitCache.set(ip, now);
  // Optional cleanup
  if (rateLimitCache.size > 1000) rateLimitCache.clear();
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }
    next();
  };
};

router.get('/search', strictRateLimit, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    const results = await searchPlaces(q);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/geocode', protect, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ success: false, message: 'Address is required' });
    const result = await geocodeAddress(address);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
