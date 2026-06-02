const Cart = require('../models/cart.model');
const Tour = require('../models/tour.model');
const Availability = require('../models/availability.model');
const stripe = require('../config/stripe');
const { computeDynamicPrice, validatePromoCode } = require('../services/pricing.service');
const DemoPaymentIntent = require('../models/demoPaymentIntent.model');
const { isDemoMode, createDemoPaymentIntent } = require('../services/demoPayment.service');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.tourId', 'title images price duration isActive')
      .populate('items.availabilityId', 'date availableSlots');

    if (!cart) {
      return res.status(200).json({ cart: { items: [], cartTotal: 0 }, hasStaleItems: false });
    }

    let cartTotal = 0;
    let hasStaleItems = false;
    
    const formattedItems = cart.items.map(item => {
      const tour = item.tourId;
      const availability = item.availabilityId;
      let stale = false;
      let staleReason = null;

      if (!tour || tour.isActive === false) {
        stale = true;
        staleReason = "Tour no longer available";
      } else if (!availability || new Date(availability.date) < new Date()) {
        stale = true;
        staleReason = "Date has passed";
      } else if (availability.availableSlots < item.slotsBooked) {
        stale = true;
        staleReason = "Not enough slots remaining";
      }

      if (stale) {
        hasStaleItems = true;
      }

      const lineTotal = item.slotsBooked * item.pricePerSlot;
      if (!stale) cartTotal += lineTotal;

      return {
        ...item.toObject(),
        lineTotal,
        stale,
        staleReason
      };
    });

    res.status(200).json({ cart: { items: formattedItems, cartTotal }, hasStaleItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { tourId, availabilityId, slotsBooked } = req.body;

    const tour = await Tour.findOne({ _id: tourId, isActive: true });
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found or not active' });

    const availability = await Availability.findById(availabilityId);
    if (!availability) return res.status(404).json({ success: false, message: 'Availability not found' });

    if (availability.availableSlots < slotsBooked) {
      return res.status(400).json({ success: false, message: 'Insufficient slots available' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const priceResult = await computeDynamicPrice({
      tourId,
      bookingDate: availability.date,
      slotsBooked: 1, // Evaluate base per-slot logic
      basePrice: tour.price
    });

    const existingItemIndex = cart.items.findIndex(
      item => item.tourId.toString() === tourId && item.availabilityId.toString() === availabilityId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].slotsBooked = slotsBooked;
      cart.items[existingItemIndex].pricePerSlot = priceResult.finalPrice;
      cart.items[existingItemIndex].basePricePerSlot = tour.price;
    } else {
      cart.items.push({
        tourId,
        availabilityId,
        slotsBooked,
        pricePerSlot: priceResult.finalPrice,
        basePricePerSlot: tour.price
      });
    }

    cart.lastActivityAt = Date.now();
    await cart.save();
    
    // Repopulate explicitly maintaining mapping constraints
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.tourId', 'title images price duration isActive')
      .populate('items.availabilityId', 'date availableSlots');

    let cartTotal = 0;
    const formattedItems = updatedCart.items.map(item => {
      const lineTotal = item.slotsBooked * item.pricePerSlot;
      cartTotal += lineTotal;
      return { ...item.toObject(), lineTotal };
    });

    res.status(200).json({ cart: { items: formattedItems, cartTotal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { slotsBooked } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not found in cart' });

    const availability = await Availability.findById(cart.items[itemIndex].availabilityId);
    if (!availability || availability.availableSlots < slotsBooked) {
      return res.status(400).json({ success: false, message: 'Insufficient slots available' });
    }

    cart.items[itemIndex].slotsBooked = slotsBooked;
    cart.lastActivityAt = Date.now();
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.tourId', 'title images price duration isActive')
      .populate('items.availabilityId', 'date availableSlots');

    let cartTotal = 0;
    const formattedItems = updatedCart.items.map(item => {
      const lineTotal = item.slotsBooked * item.pricePerSlot;
      cartTotal += lineTotal;
      return { ...item.toObject(), lineTotal };
    });

    res.status(200).json({ cart: { items: formattedItems, cartTotal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    cart.lastActivityAt = Date.now();
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.tourId', 'title images price duration isActive')
      .populate('items.availabilityId', 'date availableSlots');

    let cartTotal = 0;
    const formattedItems = updatedCart.items.map(item => {
      const lineTotal = item.slotsBooked * item.pricePerSlot;
      cartTotal += lineTotal;
      return { ...item.toObject(), lineTotal };
    });

    res.status(200).json({ cart: { items: formattedItems, cartTotal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeStaleItems = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.tourId', 'isActive')
      .populate('items.availabilityId', 'date availableSlots');

    if (!cart) return res.status(200).json({ removedCount: 0, updatedCart: null });

    const originalCount = cart.items.length;
    cart.items = cart.items.filter(item => {
      const tour = item.tourId;
      const availability = item.availabilityId;
      
      if (!tour || tour.isActive === false) return false;
      if (!availability || new Date(availability.date) < new Date()) return false;
      if (availability.availableSlots < item.slotsBooked) return false;

      return true;
    });

    const removedCount = originalCount - cart.items.length;
    cart.lastActivityAt = Date.now();
    await cart.save();
    
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.tourId', 'title images price duration isActive')
      .populate('items.availabilityId', 'date availableSlots');
      
    let cartTotal = 0;
    const formattedItems = updatedCart.items.map(item => {
      const lineTotal = item.slotsBooked * item.pricePerSlot;
      cartTotal += lineTotal;
      return { ...item.toObject(), lineTotal };
    });

    res.status(200).json({ removedCount, cart: { items: formattedItems, cartTotal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      cart.lastActivityAt = Date.now();
      await cart.save();
    }
    res.status(200).json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCartCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    const count = cart ? cart.items.length : 0;
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cartCheckout = async (req, res) => {
  try {
    const { promoCode } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.tourId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const unavailableItems = [];
    let cartTotal = 0;
    const checkoutItems = [];

    for (const item of cart.items) {
      const availability = await Availability.findById(item.availabilityId);
      
      let isAvailable = true;
      let reason = '';

      if (!availability) {
        isAvailable = false;
        reason = 'Date is no longer listed';
      } else if (new Date(availability.date) < new Date()) {
        isAvailable = false;
        reason = 'Date has passed';
      } else if (availability.availableSlots < item.slotsBooked) {
        isAvailable = false;
        reason = `Only ${availability.availableSlots} slots remaining`;
      }

      const tour = await Tour.findById(item.tourId);
      if (!tour || tour.isActive === false) {
        isAvailable = false;
        reason = 'Tour no longer available';
      }

      if (!isAvailable) {
        unavailableItems.push({
          tourTitle: item.tourId ? item.tourId.title : 'Unknown Tour',
          reason
        });
        continue;
      }

      const priceResult = await computeDynamicPrice({
        tourId: item.tourId._id,
        bookingDate: availability.date,
        slotsBooked: item.slotsBooked,
        basePrice: item.basePricePerSlot || item.pricePerSlot
      });

      // Update stored dynamic line price just in case it mutated
      item.pricePerSlot = priceResult.finalPrice;

      const lineTotal = priceResult.totalAmount;
      cartTotal += lineTotal;
      checkoutItems.push({
        tourTitle: item.tourId ? item.tourId.title : 'Unknown Tour',
        bookingDate: availability ? availability.date : 'Unknown Date',
        slotsBooked: item.slotsBooked,
        basePrice: priceResult.basePrice,
        dynamicPrice: priceResult.finalPrice,
        appliedRule: priceResult.appliedRule,
        lineTotal
      });
    }

    // Save cart modifications 
    await cart.save();

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some items are no longer available',
        unavailableItems
      });
    }

    let finalTotalAmount = cartTotal;
    let discountAmount = 0;
    
    if (promoCode) {
      const promoResult = await validatePromoCode({
        code: promoCode,
        tourId: null, // Global cart context validations will apply empty list checks natively
        orderAmount: cartTotal
      });
      if (!promoResult.valid) {
         return res.status(400).json({ success: false, message: promoResult.message });
      }
      discountAmount = promoResult.discountAmount;
      finalTotalAmount = promoResult.finalAmount;
    }

    if (isDemoMode()) {
      const demoIntent = createDemoPaymentIntent({
        amount: Math.round(finalTotalAmount * 100),
        currency: 'inr',
        metadata: {
          userId: req.user.id,
          cartId: cart._id.toString(),
          type: 'cart_checkout',
          promoCode: promoCode || ''
        }
      });

      await DemoPaymentIntent.create({
        paymentIntentId: demoIntent.id,
        clientSecret: demoIntent.client_secret,
        amount: Math.round(finalTotalAmount * 100),
        currency: 'inr',
        metadata: demoIntent.metadata
      });

      return res.status(200).json({
        success: true,
        clientSecret: demoIntent.client_secret,
        cartTotal,
        finalTotalAmount,
        promoDiscount: discountAmount,
        itemCount: cart.items.length,
        items: checkoutItems,
        isDemoMode: true,
        data: {
          clientSecret: demoIntent.client_secret,
          cartTotal,
          itemCount: cart.items.length,
          items: checkoutItems,
          isDemoMode: true
        }
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalTotalAmount * 100),
      currency: 'inr',
      metadata: {
        userId: req.user.id,
        cartId: cart._id.toString(),
        type: 'cart_checkout',
        promoCode: promoCode ? promoCode : '',
        promoDiscount: discountAmount
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      cartTotal,
      finalTotalAmount,
      promoDiscount: discountAmount,
      itemCount: cart.items.length,
      items: checkoutItems
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
