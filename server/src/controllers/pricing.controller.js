const PricingRule = require('../models/pricingRule.model');
const Promotion = require('../models/promotion.model');
const Tour = require('../models/tour.model');
const Availability = require('../models/availability.model');
const { computeDynamicPrice, validatePromoCode } = require('../services/pricing.service');

// ------------------------------
// Pricing Rules (Operator)
// ------------------------------

exports.getPricingRules = async (req, res) => {
  try {
    const tours = await Tour.find({ operatorId: req.user.id });
    const tourIds = tours.map(t => t._id);
    const rules = await PricingRule.find({ tourId: { $in: tourIds } }).populate('tourId', 'title');
    res.status(200).json({ status: 'success', data: { rules } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createPricingRule = async (req, res) => {
  try {
    const { tourId } = req.body;
    const tour = await Tour.findOne({ _id: tourId, operatorId: req.user.id });
    if (!tour) return res.status(403).json({ status: 'fail', message: 'Not authorized for this tour.' });

    const rule = await PricingRule.create(req.body);
    res.status(201).json({ status: 'success', data: { rule } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updatePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id).populate('tourId');
    if (!rule) return res.status(404).json({ status: 'fail', message: 'Rule not found' });
    
    // Explicit checks since map doesn't always populate directly globally
    const tour = await Tour.findById(rule.tourId);
    if (tour.operatorId.toString() !== req.user.id) {
       return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    const updatedRule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ status: 'success', data: { rule: updatedRule } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deletePricingRule = async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ status: 'fail', message: 'Rule not found' });
    
    const tour = await Tour.findById(rule.tourId);
    if (tour.operatorId.toString() !== req.user.id) {
       return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    await PricingRule.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ------------------------------
// Pricing Engine (Public)
// ------------------------------

exports.calculatePrice = async (req, res) => {
  try {
    const { tourId, availabilityId, slotsBooked } = req.body;
    
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ status: 'fail', message: 'Tour not found' });
    
    const availability = await Availability.findById(availabilityId);
    if (!availability) return res.status(404).json({ status: 'fail', message: 'Availability not found' });

    const priceResult = await computeDynamicPrice({
      tourId,
      bookingDate: availability.date,
      slotsBooked: Number(slotsBooked) || 1,
      basePrice: tour.price
    });

    res.status(200).json({ status: 'success', data: priceResult });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ------------------------------
// Promotions Engine (Public hooks)
// ------------------------------

exports.validatePromo = async (req, res) => {
  try {
    const { code, tourId, orderAmount } = req.body;
    const result = await validatePromoCode({ code, tourId, orderAmount });
    
    if (result.valid) {
      res.status(200).json({ status: 'success', data: result });
    } else {
      res.status(400).json({ status: 'fail', message: result.message });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ------------------------------
// Admin Promotions CRUD
// ------------------------------

exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().populate('createdBy', 'name');
    res.status(200).json({ status: 'success', data: { promotions } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const normalizedCode = String(req.body.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9\-]+$/.test(normalizedCode) || normalizedCode.length < 3 || normalizedCode.length > 20) {
      return res.status(400).json({ status: 'fail', message: 'Invalid promo code format' });
    }
    const data = { ...req.body, code: normalizedCode, createdBy: req.user.id };
    const promotion = await Promotion.create(data);
    res.status(201).json({ status: 'success', data: { promotion } });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ status: 'fail', message: 'Promo code already exists' });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!promotion) return res.status(404).json({ status: 'fail', message: 'Promotion not found' });
    res.status(200).json({ status: 'success', data: { promotion } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) return res.status(404).json({ status: 'fail', message: 'Promotion not found' });
    res.status(200).json({ status: 'success', message: 'Promotion deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ------------------------------
// Operator Promotions view
// ------------------------------

exports.getOperatorPromotions = async (req, res) => {
  try {
    const tours = await Tour.find({ operatorId: req.user.id }).select('_id');
    const tourIds = tours.map(t => t._id);
    
    const promotions = await Promotion.find({
      $or: [
        { applicableTours: { $size: 0 } },
        { applicableTours: { $in: tourIds } }
      ]
    });
    res.status(200).json({ status: 'success', data: { promotions } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
