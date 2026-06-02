const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const Tour = require('../models/tour.model');
const User = require('../models/user.model');
const { sendEmail } = require('../config/mailer');

exports.getConversations = async (req, res) => {
  try {
    const conversationsRaw = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'name email role')
      .populate('tourId', 'title images')
      .sort({ lastMessageAt: -1 });

    let unreadCountTotal = 0;

    const conversations = conversationsRaw.map(c => {
      const isUnread = !c.isReadBy.includes(req.user.id);
      if (isUnread) unreadCountTotal += 1;
      return {
        ...c.toObject(),
        isUnread
      };
    });

    res.status(200).json({ success: true, conversations, unreadCount: unreadCountTotal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId, tourId } = req.body;
    
    if (req.user.id === recipientId) {
       return res.status(400).json({ success: false, message: "Cannot create conversation with yourself" });
    }

    let query = { participants: { $all: [req.user.id, recipientId] } };
    if (tourId) query.tourId = tourId;

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
        tourId: tourId || null,
        isReadBy: [req.user.id, recipientId] // Initial empty state read by both
      });
    }

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email role')
      .populate('tourId', 'title images');

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Unread cleanup
    await Message.updateMany(
      { conversationId, senderId: { $ne: req.user.id }, isRead: false },
      { $set: { isRead: true, readAt: Date.now() } }
    );

    if (!conversation.isReadBy.includes(req.user.id)) {
      conversation.isReadBy.push(req.user.id);
      await conversation.save();
    }

    const messagesRaw = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversationId });

    // Reverse for oldest first logically for FE chat displays typically, or pass array down
    const messages = messagesRaw.reverse(); 

    res.status(200).json({
      success: true,
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const rawContent = String(req.body.content || '');
    const content = rawContent.trim();
    const { messageType = 'text' } = req.body;

    if (!content || content.length < 1 || content.length > 2000) {
      return res.status(400).json({ success: false, message: 'Content is required and must be between 1 and 2000 characters' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      content,
      messageType
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = Date.now();
    conversation.lastMessageBy = req.user.id;
    conversation.isReadBy = [req.user.id]; // Reset read map to sender
    await conversation.save();

    // Send async email block softly
    const recipientId = conversation.participants.find(p => p.toString() !== req.user.id.toString());
    if (recipientId) {
      const recipient = await User.findById(recipientId);
      const sender = await User.findById(req.user.id);
      if (recipient && sender) {
        const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
        sendEmail({
           to: recipient.email,
           subject: `New message from ${sender.name}`,
           html: `<div style="font-family:sans-serif;padding:20px;">
                    <h2>New Message</h2>
                    <p><strong>${sender.name}:</strong> "${preview}"</p>
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/messages" style="background:#b8860b;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:10px;">Reply Now</a>
                  </div>`
        }).catch(err => console.error("Message email failed", err));
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Conversation.countDocuments({
      participants: req.user.id,
      isReadBy: { $ne: req.user.id }
    });
    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.closeConversation = async (req, res) => {
  try {
    if (!['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    
    conversation.status = 'closed';
    await conversation.save();

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======= Preserved Helpers for Bookings & Detail Page (Previous prompts) =======

exports.getOrCreateConversationObj = async (userId, operatorUserId, tourId) => {
  let query = { participants: { $all: [userId, operatorUserId] } };
  if (tourId) query.tourId = tourId;
  let conversation = await Conversation.findOne(query);

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, operatorUserId],
      tourId: tourId || null,
      isReadBy: [userId, operatorUserId]
    });
  }
  return conversation;
};

exports.autoCreateSystemMessage = async (userId, tourId, content) => {
  try {
    const tour = await Tour.findById(tourId).populate('operatorId');
    if (!tour || !tour.operatorId) return;
    const operatorUserId = tour.operatorId.userId || tour.operatorId;

    const conversation = await exports.getOrCreateConversationObj(userId, operatorUserId, tourId);
    
    await Message.create({
      conversationId: conversation._id,
      senderId: operatorUserId, // System implies sender is host theoretically or root
      content,
      messageType: 'system',
      isRead: false
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = Date.now();
    conversation.isReadBy = []; // both unread since system generated
    await conversation.save();

  } catch(err) {
    console.error("System message creation failed", err);
  }
};

exports.inquiry = async (req, res) => {
  try {
    const { operatorId, tourId, message } = req.body;
    let operatorUserId = operatorId; 
    
    const tour = await Tour.findById(tourId).populate('operatorId');
    if (tour && tour.operatorId && tour.operatorId.userId) {
       operatorUserId = tour.operatorId.userId;
    }

    const conversation = await exports.getOrCreateConversationObj(req.user.id, operatorUserId, tourId);

    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.id,
      content: message,
      messageType: 'inquiry'
    });

    conversation.lastMessage = message;
    conversation.lastMessageAt = Date.now();
    conversation.lastMessageBy = req.user.id;
    conversation.isReadBy = [req.user.id];
    await conversation.save();

    res.status(200).json({ success: true, conversation, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
