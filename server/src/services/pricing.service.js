const PricingRule = require('../models/pricingRule.model');
const Promotion = require('../models/promotion.model');
const Booking = require('../models/booking.model');

exports.computeDynamicPrice = async ({ tourId, bookingDate, slotsBooked, basePrice }) => {
  const rules = await PricingRule.find({ tourId, isActive: true }).sort({ priority: -1 });
  let appliedRule = null;
  const bDate = new Date(bookingDate);
  const today = new Date();
  
  // Clean day difference
  const daysDifference = Math.floor((bDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

  for (const rule of rules) {
    let matches = false;
    
    switch (rule.type) {
      case 'dayofweek':
        if (rule.conditions && rule.conditions.daysOfWeek) {
          matches = rule.conditions.daysOfWeek.includes(bDate.getDay());
        }
        break;
      case 'seasonal':
        if (rule.conditions && rule.conditions.dateFrom && rule.conditions.dateTo) {
          const from = new Date(rule.conditions.dateFrom);
          const to = new Date(rule.conditions.dateTo);
          matches = bDate >= from && bDate <= to;
        }
        break;
      case 'earlybird':
        if (rule.conditions && typeof rule.conditions.minDaysBeforeBooking === 'number') {
          matches = daysDifference >= rule.conditions.minDaysBeforeBooking;
        }
        break;
      case 'lastminute':
        if (rule.conditions && typeof rule.conditions.maxDaysBeforeBooking === 'number') {
          matches = daysDifference <= rule.conditions.maxDaysBeforeBooking;
        }
        break;
      case 'demand':
        if (rule.conditions && typeof rule.conditions.minBookingsThreshold === 'number') {
           const existingBookings = await Booking.aggregate([
             { $match: { tourId: tourId, bookingDate: bDate, 'paymentStatus': 'paid' } },
             { $group: { _id: null, totalBooked: { $sum: "$slotsBooked" } } }
           ]);
           const currentBookedCount = existingBookings.length > 0 ? existingBookings[0].totalBooked : 0;
           matches = currentBookedCount >= rule.conditions.minBookingsThreshold;
        }
        break;
    }

    if (matches) {
      appliedRule = rule;
      break; 
    }
  }

  let finalPrice = basePrice;
  if (appliedRule) {
    if (appliedRule.adjustmentType === 'percentage') {
      finalPrice = basePrice * (1 + appliedRule.adjustmentValue / 100);
    } else if (appliedRule.adjustmentType === 'fixed') {
      finalPrice = basePrice + appliedRule.adjustmentValue;
    }
    if (finalPrice < 0) finalPrice = 0;
  }

  return {
    finalPrice,
    basePrice,
    appliedRule: appliedRule ? {
      name: appliedRule.name,
      type: appliedRule.type,
      adjustmentType: appliedRule.adjustmentType,
      adjustmentValue: appliedRule.adjustmentValue
    } : null,
    totalAmount: finalPrice * slotsBooked
  };
};

exports.validatePromoCode = async ({ code, tourId, orderAmount }) => {
  const promotion = await Promotion.findOne({ code: new RegExp(`^${code}$`, 'i') });
  
  if (!promotion) return { valid: false, message: "Invalid promo code." };
  if (!promotion.isActive) return { valid: false, message: "Promo code is inactive." };
  
  const now = new Date();
  if (now < new Date(promotion.validFrom) || now > new Date(promotion.validTo)) {
    return { valid: false, message: "Promo code is not valid at this time." };
  }
  
  if (promotion.usageLimit !== null && promotion.usageLimit !== undefined && promotion.usedCount >= promotion.usageLimit) {
    return { valid: false, message: "Promo code usage limit has been reached." };
  }
  
  if (orderAmount < promotion.minOrderAmount) {
    return { valid: false, message: `Minimum order amount of ₹${promotion.minOrderAmount} is required.` };
  }
  
  if (promotion.applicableTours && promotion.applicableTours.length > 0) {
    const isApplicable = promotion.applicableTours.some(tId => tId.toString() === tourId.toString());
    if (!isApplicable) {
      return { valid: false, message: "Promo code is not applicable for this tour." };
    }
  }

  let discountAmount = 0;
  if (promotion.discountType === 'percentage') {
    discountAmount = orderAmount * (promotion.discountValue / 100);
    if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
      discountAmount = promotion.maxDiscountAmount;
    }
  } else if (promotion.discountType === 'fixed') {
    discountAmount = promotion.discountValue;
  }
  
  if (discountAmount > orderAmount) discountAmount = orderAmount;

  return {
    valid: true,
    discountAmount,
    finalAmount: orderAmount - discountAmount,
    promotion: {
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue
    }
  };
};

exports.applyPromoUsage = async (code) => {
  if (!code) return;
  await Promotion.findOneAndUpdate(
    { code: new RegExp(`^${code}$`, 'i') },
    { $inc: { usedCount: 1 } }
  );
};
