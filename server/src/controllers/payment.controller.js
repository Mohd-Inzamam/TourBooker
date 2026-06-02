const stripe = require('../config/stripe');
const Tour = require('../models/tour.model');
const Availability = require('../models/availability.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const { sendEmail } = require('../config/mailer');
const { bookingConfirmationEmail, newBookingAlertEmail } = require('../utils/emailTemplates');
const { computeDynamicPrice, validatePromoCode, applyPromoUsage } = require('../services/pricing.service');
const { autoCreateSystemMessage } = require('./messaging.controller');
const DemoPaymentIntent = require('../models/demoPaymentIntent.model');
const { isDemoMode, createDemoPaymentIntent } = require('../services/demoPayment.service');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { tourId, availabilityId, slotsBooked, promoCode } = req.body;

    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });

    const availability = await Availability.findById(availabilityId);
    if (!availability) return res.status(404).json({ success: false, message: 'Availability not found' });

    if (availability.tourId.toString() !== tourId) {
      return res.status(400).json({ success: false, message: 'Availability does not belong to this tour' });
    }

    if (availability.availableSlots < slotsBooked) {
      return res.status(400).json({ success: false, message: 'Insufficient slots available' });
    }

    const priceResult = await computeDynamicPrice({
      tourId,
      bookingDate: availability.date,
      slotsBooked,
      basePrice: tour.price
    });
    
    let finalTotalAmount = priceResult.totalAmount;
    let discountAmount = 0;

    if (promoCode) {
      const promoResult = await validatePromoCode({
        code: promoCode,
        tourId,
        orderAmount: finalTotalAmount
      });
      if (!promoResult.valid) {
         return res.status(400).json({ success: false, message: promoResult.message });
      }
      discountAmount = promoResult.discountAmount;
      finalTotalAmount = promoResult.finalAmount;
    }

    const totalAmount = Math.round(finalTotalAmount * 100);

    if (isDemoMode()) {
      const demoIntent = createDemoPaymentIntent({
        amount: totalAmount,
        currency: 'inr',
        metadata: {
          tourId,
          availabilityId,
          slotsBooked,
          userId: req.user.id,
          promoCode: promoCode || '',
          basePricePerSlot: tour.price,
          finalPricePerSlot: priceResult.finalPrice,
          appliedRule: priceResult.appliedRule ? JSON.stringify(priceResult.appliedRule) : '',
          promoDiscount: discountAmount
        }
      });

      await DemoPaymentIntent.create({
        paymentIntentId: demoIntent.id,
        clientSecret: demoIntent.client_secret,
        amount: totalAmount,
        currency: 'inr',
        metadata: demoIntent.metadata
      });

      return res.status(200).json({
        success: true,
        clientSecret: demoIntent.client_secret,
        basePrice: tour.price,
        finalPricePerSlot: priceResult.finalPrice,
        appliedRule: priceResult.appliedRule,
        promoDiscount: discountAmount,
        totalAmount: finalTotalAmount,
        tourTitle: tour.title,
        slotsBooked,
        isDemoMode: true,
        data: {
          clientSecret: demoIntent.client_secret,
          basePrice: tour.price,
          finalPricePerSlot: priceResult.finalPrice,
          appliedRule: priceResult.appliedRule || null,
          promoDiscount: discountAmount || 0,
          totalAmount: finalTotalAmount,
          tourTitle: tour.title,
          slotsBooked,
          isDemoMode: true
        }
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'inr',
      metadata: {
        tourId,
        availabilityId,
        slotsBooked,
        userId: req.user.id,
        promoCode: promoCode || '',
        basePricePerSlot: tour.price,
        finalPricePerSlot: priceResult.finalPrice,
        appliedRule: priceResult.appliedRule ? JSON.stringify(priceResult.appliedRule) : '',
        promoDiscount: discountAmount
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      basePrice: tour.price,
      finalPricePerSlot: priceResult.finalPrice,
      appliedRule: priceResult.appliedRule,
      promoDiscount: discountAmount,
      totalAmount: finalTotalAmount,
      tourTitle: tour.title,
      slotsBooked
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  // Note: express.raw() parsing is handled in app.js before this controller
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // Determine if it is a single item checkout or full cart checkout
    if (paymentIntent.metadata.type === 'cart_checkout') {
      const { cartId, userId } = paymentIntent.metadata;
      
      try {
        const cart = await Cart.findById(cartId).populate({
          path: 'items.tourId',
          select: 'title operatorId'
        });

        if (!cart) return res.status(400).send('Cart not found');
        const user = await User.findById(userId);

        if (paymentIntent.metadata.promoCode) {
           await applyPromoUsage(paymentIntent.metadata.promoCode);
        }

        for (const item of cart.items) {
           // ... logic mapped inside loop safely resolving atomic updates gracefully
           let availability = await Availability.findOneAndUpdate(
             { _id: item.availabilityId, availableSlots: { $gte: Number(item.slotsBooked) } },
             { $inc: { availableSlots: -Number(item.slotsBooked), bookedSlots: Number(item.slotsBooked) } },
             { new: true }
           );
           
           if (!availability) {
              console.error(`Concurrency overlap fallback fetching date quietly: ${item.availabilityId}`);
              availability = await Availability.findById(item.availabilityId);
           }

           const tour = item.tourId; 
           const bookingDateVal = availability ? availability.date : new Date();
           // In cart, discount is applied to cartTotal, meaning per booking we can prorate or just flag cart promo logic
           
           const booking = await Booking.create({
             userId,
             tourId: tour._id,
             availabilityId: item.availabilityId,
             bookingDate: bookingDateVal,
             slotsBooked: Number(item.slotsBooked),
             totalPrice: Number(item.slotsBooked) * Number(item.pricePerSlot), // Dynamic line natively evaluated inside cart pre-checkout
             status: 'confirmed',
             paymentIntentId: paymentIntent.id,
             basePricePerSlot: item.basePricePerSlot,
             finalPricePerSlot: item.pricePerSlot,
             promoCodeUsed: paymentIntent.metadata.promoCode || ''
           });

           await autoCreateSystemMessage(
             userId,
             tour._id,
             `Booking confirmed for ${tour.title || 'Tour'} on ${new Date(bookingDateVal).toLocaleDateString()}. ${item.slotsBooked} slot(s) booked. Booking reference: ${paymentIntent.id}`
           );

          if (user && tour) {
            sendEmail({
              to: user.email,
              subject: 'Your Booking is Confirmed! 🎉',
              html: bookingConfirmationEmail({
                userName: user.name,
                tourTitle: tour.title,
                bookingDate: booking.bookingDate,
                slotsBooked: booking.slotsBooked,
                totalPrice: booking.totalPrice,
                paymentIntentId: booking.paymentIntentId
              })
            }).catch(console.error);

            if (tour.operatorId) {
              const operatorUser = await User.findById(tour.operatorId.userId || tour.operatorId);
              if (operatorUser) {
                sendEmail({
                  to: operatorUser.email,
                  subject: `New Booking Received for ${tour.title}`,
                  html: newBookingAlertEmail({
                    operatorName: operatorUser.name,
                    tourTitle: tour.title,
                    userName: user.name,
                    bookingDate: booking.bookingDate,
                    slotsBooked: booking.slotsBooked
                  })
                }).catch(console.error);
              }
            }
          }
        }
        
        // Clear cart
        cart.items = [];
        await cart.save();

      } catch(err) {
        console.error("Cart checkout fulfillment failed:", err);
      }
    } else {
      // SINGLE CHECKOUT LOGIC
      const { tourId, availabilityId, slotsBooked, userId } = paymentIntent.metadata;

      try {
        if (paymentIntent.metadata.promoCode) {
           await applyPromoUsage(paymentIntent.metadata.promoCode);
        }
        
        let availability = await Availability.findOneAndUpdate(
           { _id: availabilityId, availableSlots: { $gte: Number(slotsBooked) } },
           { $inc: { availableSlots: -Number(slotsBooked), bookedSlots: Number(slotsBooked) } },
           { new: true }
        );
        
        if (!availability) {
           console.error("Concurrency overlap slot grabbed catching date gracefully natively");
           availability = await Availability.findById(availabilityId);
        }

        const booking = await Booking.create({
          userId,
          tourId,
          availabilityId,
          bookingDate: availability ? availability.date : new Date(),
          slotsBooked: Number(slotsBooked),
          totalPrice: paymentIntent.amount / 100,
          status: 'confirmed',
          paymentIntentId: paymentIntent.id,
          basePricePerSlot: Number(paymentIntent.metadata.basePricePerSlot),
          finalPricePerSlot: Number(paymentIntent.metadata.finalPricePerSlot),
          appliedPricingRule: paymentIntent.metadata.appliedRule || '',
          promoCodeUsed: paymentIntent.metadata.promoCode || '',
          promoDiscount: Number(paymentIntent.metadata.promoDiscount || 0)
        });

        // Send emails and open channel
        const user = await User.findById(userId);
        const tour = await Tour.findById(tourId).populate({
          path: 'operatorId',
          select: 'userId'
        });

        if (tour) {
          await autoCreateSystemMessage(
            userId,
            tourId,
            `Booking confirmed for ${tour.title} on ${new Date(booking.bookingDate).toLocaleDateString()}. ${slotsBooked} slot(s) booked. Booking reference: ${paymentIntent.id}`
          );
        }
        
        if (user && tour) {
          sendEmail({
            to: user.email,
            subject: 'Your Booking is Confirmed! 🎉',
            html: bookingConfirmationEmail({
              userName: user.name,
              tourTitle: tour.title,
              bookingDate: booking.bookingDate,
              slotsBooked: booking.slotsBooked,
              totalPrice: booking.totalPrice,
              paymentIntentId: booking.paymentIntentId
            })
          }).catch(console.error);

          // Fetch operator email
          if (tour.operatorId && tour.operatorId.userId) {
            const operatorUser = await User.findById(tour.operatorId.userId);
            if (operatorUser) {
              sendEmail({
                to: operatorUser.email,
                subject: `New Booking Received for ${tour.title}`,
                html: newBookingAlertEmail({
                  operatorName: operatorUser.name,
                  tourTitle: tour.title,
                  userName: user.name,
                  bookingDate: booking.bookingDate,
                  slotsBooked: booking.slotsBooked
                })
              }).catch(console.error);
            }
          }
        }
      } catch (err) {
        console.error("Booking creation failed on Stripe Success:", err);
      }
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    console.error('Payment failed:', event.data.object);
  }

  // Stripe requires 200 response to acknowledge receipt
  res.json({ received: true });
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (isDemoMode()) {
      const demoIntent = await DemoPaymentIntent.findOne({ paymentIntentId });
      if (!demoIntent) {
        return res.status(404).json({
          success: false,
          message: 'Demo payment not found'
        });
      }

      const booking = await Booking.findOne({ paymentIntentId })
        .populate('tourId', 'title images price')
        .populate('availabilityId', 'date');

      return res.status(200).json({
        success: true,
        booking,
        isDemoMode: true,
        data: {
          success: true,
          booking,
          isDemoMode: true
        }
      });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const booking = await Booking.findOne({ paymentIntentId })
        .populate('tourId', 'title images price')
        .populate('availabilityId', 'date');
      
      return res.status(200).json({ 
        success: true, 
        booking 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        status: paymentIntent.status 
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ 
      userId: req.user.id, 
      paymentIntentId: { $exists: true, $ne: null } 
    })
      .populate('tourId', 'title images price')
      .populate('availabilityId', 'date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments({ 
      userId: req.user.id, 
      paymentIntentId: { $exists: true, $ne: null } 
    });

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
