const DemoPaymentIntent = require('../models/demoPaymentIntent.model');
const Availability = require('../models/availability.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const Tour = require('../models/tour.model');
const Cart = require('../models/cart.model');
const { sendEmail } = require('../config/mailer');
const { bookingConfirmationEmail, newBookingAlertEmail } = require('../utils/emailTemplates');
const { autoCreateSystemMessage } = require('./messaging.controller');
const { applyPromoUsage } = require('../services/pricing.service');
const { isDemoMode } = require('../services/demoPayment.service');

const confirmDemoPaymentIntent = async (req, res) => {
  try {
    if (!isDemoMode()) {
      return res.status(403).json({ success: false, message: 'Demo mode is disabled' });
    }

    const { paymentIntentId } = req.body;

    const demoIntent = await DemoPaymentIntent.findOne({ paymentIntentId });
    if (!demoIntent) {
      return res.status(404).json({
        success: false,
        message: 'Demo payment intent not found'
      });
    }

    if (demoIntent.status === 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment already confirmed'
      });
    }

    const { metadata = {} } = demoIntent;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (metadata.type === 'cart_checkout') {
      const { cartId, userId } = metadata;
      const cart = await Cart.findById(cartId).populate({
        path: 'items.tourId',
        select: 'title operatorId'
      });

      if (!cart) {
        return res.status(404).json({ success: false, message: 'Cart not found' });
      }

      const user = await User.findById(userId);
      const createdBookings = [];

      for (const item of cart.items) {
        let availability = await Availability.findOneAndUpdate(
          { _id: item.availabilityId, availableSlots: { $gte: Number(item.slotsBooked) } },
          { $inc: { availableSlots: -Number(item.slotsBooked), bookedSlots: Number(item.slotsBooked) } },
          { new: true }
        );

        if (!availability) {
          availability = await Availability.findById(item.availabilityId);
          if (!availability) {
            return res.status(400).json({ success: false, message: 'Not enough slots available' });
          }
        }

        const tour = item.tourId;
        const bookingDateVal = availability?.date || new Date();
        const booking = await Booking.create({
          userId,
          tourId: tour._id,
          availabilityId: item.availabilityId,
          bookingDate: bookingDateVal,
          slotsBooked: Number(item.slotsBooked),
          totalPrice: Number(item.slotsBooked) * Number(item.pricePerSlot),
          status: 'confirmed',
          paymentIntentId,
          basePricePerSlot: item.basePricePerSlot,
          finalPricePerSlot: item.pricePerSlot,
          promoCodeUsed: metadata.promoCode || ''
        });
        createdBookings.push(booking);

        await autoCreateSystemMessage(
          userId,
          tour._id,
          `Booking confirmed for ${tour.title || 'Tour'} on ${new Date(bookingDateVal).toLocaleDateString()}. ${item.slotsBooked} slot(s) booked. Booking reference: ${paymentIntentId}`
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
              paymentIntentId
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

      if (metadata.promoCode) {
        await applyPromoUsage(metadata.promoCode).catch(console.error);
      }

      cart.items = [];
      await cart.save();

      await DemoPaymentIntent.findOneAndUpdate(
        { paymentIntentId },
        { status: 'succeeded' }
      );

      return res.status(200).json({
        success: true,
        message: 'Demo payment confirmed',
        data: { bookings: createdBookings, isDemoMode: true }
      });
    }

    const availability = await Availability.findOneAndUpdate(
      {
        _id: metadata.availabilityId,
        availableSlots: { $gte: Number(metadata.slotsBooked) }
      },
      {
        $inc: {
          availableSlots: -Number(metadata.slotsBooked),
          bookedSlots: Number(metadata.slotsBooked)
        }
      },
      { new: true }
    );

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: 'Not enough slots available'
      });
    }

    const booking = await Booking.create({
      userId: metadata.userId,
      tourId: metadata.tourId,
      availabilityId: metadata.availabilityId,
      bookingDate: availability.date,
      slotsBooked: Number(metadata.slotsBooked),
      totalPrice: demoIntent.amount / 100,
      status: 'confirmed',
      paymentIntentId,
      promoCodeUsed: metadata.promoCode || undefined
    });

    const user = await User.findById(metadata.userId).select('-password');
    const tour = await Tour.findById(metadata.tourId).populate({ path: 'operatorId', select: 'userId' });
    const operatorUserId = tour?.operatorId?.userId || tour?.operatorId;
    const operator = operatorUserId ? await User.findById(operatorUserId).select('-password') : null;

    if (user && tour) {
      sendEmail({
        to: user.email,
        subject: 'Your Booking is Confirmed! 🎉',
        html: bookingConfirmationEmail({
          userName: user.name,
          tourTitle: tour.title,
          bookingDate: availability.date,
          slotsBooked: metadata.slotsBooked,
          totalPrice: demoIntent.amount / 100,
          paymentIntentId
        })
      }).catch(console.error);
    }

    if (operator && tour && user) {
      sendEmail({
        to: operator.email,
        subject: `New Booking Received for ${tour.title}`,
        html: newBookingAlertEmail({
          operatorName: operator.name,
          tourTitle: tour.title,
          userName: user.name,
          bookingDate: availability.date,
          slotsBooked: metadata.slotsBooked
        })
      }).catch(console.error);
    }

    if (tour) {
      await autoCreateSystemMessage(
        metadata.userId,
        metadata.tourId,
        `Booking confirmed for ${tour.title} on ${new Date(availability.date).toLocaleDateString()}. ${metadata.slotsBooked} slot(s) booked. Booking reference: ${paymentIntentId}`
      );
    }

    if (metadata.promoCode) {
      await applyPromoUsage(metadata.promoCode).catch(console.error);
    }

    await DemoPaymentIntent.findOneAndUpdate(
      { paymentIntentId },
      { status: 'succeeded' }
    );

    return res.status(200).json({
      success: true,
      message: 'Demo payment confirmed',
      data: { booking, isDemoMode: true }
    });
  } catch (error) {
    console.error('Demo payment confirmation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Demo payment confirmation failed'
    });
  }
};

module.exports = {
  confirmDemoPaymentIntent
};
