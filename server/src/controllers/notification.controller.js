const Cart = require('../models/cart.model');
const Conversation = require('../models/conversation.model');
const Booking = require('../models/booking.model');
const Tour = require('../models/tour.model');
const Operator = require('../models/operator.model');

exports.getSummary = async (req, res) => {
  try {
    let cartCount = 0;
    let unreadMessages = 0;
    let pendingBookings = 0;

    if (req.user.role === 'user') {
       const cart = await Cart.findOne({ userId: req.user.id });
       if (cart) cartCount = cart.items.length;
    }

    unreadMessages = await Conversation.countDocuments({
      participants: req.user.id,
      isReadBy: { $ne: req.user.id }
    });

    if (req.user.role === 'operator') {
       const operator = await Operator.findOne({ userId: req.user.id });
       let operatorId = operator ? operator._id : req.user.id; 
       
       const tours = await Tour.find({ operatorId });
       const tourIds = tours.map(t => t._id);

       const next7Days = new Date();
       next7Days.setDate(next7Days.getDate() + 7);

       pendingBookings = await Booking.countDocuments({
         tourId: { $in: tourIds },
         status: 'confirmed',
         bookingDate: { $gte: new Date(), $lte: next7Days }
       });
    }

    res.status(200).json({
       success: true,
       cartCount,
       unreadMessages,
       pendingBookings
    });
  } catch (error) {
     res.status(500).json({ success: false, message: error.message });
  }
};
