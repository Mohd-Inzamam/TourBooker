const mongoose = require('mongoose');
const RecommendationCache = require('../models/recommendationCache.model');
const ChatbotConversation = require('../models/chatbotConversation.model');
const Tour = require('../models/tour.model');
const Booking = require('../models/booking.model');
const { getRecommendations, chatbotReply } = require('../services/ai.service');

exports.getRecommendationsForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1) Return cached recommendations if fresh
    const cache = await RecommendationCache.findOne({ userId }).populate('recommendedTours');
    if (cache && cache.recommendedTours.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Recommendations retrieved from cache',
        data: { recommendations: cache.recommendedTours, total: cache.recommendedTours.length }
      });
    }

    // 2) Build user profile from booking history
    const userBookings = await Booking.find({ userId }).populate('tourId');
    const userProfile = {
      pastTours: userBookings
        .filter(b => b.tourId)
        .map(b => ({
          title: b.tourId.title,
          price: b.tourId.price,
          category: b.tourId.categoryId,
          rating: b.tourId.ratingAverage
        }))
    };

    // 3) Fetch all tours for the recommendation engine
    const toursList = await Tour.find({ isActive: true })
      .select('title price categoryId locationId ratingAverage')
      .lean();

    // 4) Get AI recommendations
    const recommendedIds = await getRecommendations(userProfile, toursList);

    if (!Array.isArray(recommendedIds)) {
      throw new Error('AI service returned an invalid response format');
    }

    // 5) Cache for subsequent requests
    await RecommendationCache.findOneAndUpdate(
      { userId },
      { userId, recommendedTours: recommendedIds },
      { upsert: true, new: true }
    );

    const recommendedTours = await Tour.find({ _id: { $in: recommendedIds }, isActive: true });

    res.status(200).json({
      success: true,
      message: 'Recommendations generated successfully',
      data: { recommendations: recommendedTours, total: recommendedTours.length }
    });
  } catch (error) {
    console.error('Recommendations Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get recommendations' });
  }
};

exports.chatWithBot = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'A non-empty message is required' });
    }

    // Fetch active tours to provide as context to the bot
    const activeTours = await Tour.find({ isActive: true })
      .select('title price city country')
      .limit(50)
      .lean();

    const tourContext = activeTours.map(t => 
      `- ${t.title} in ${t.city}, ${t.country} for $${t.price}`
    ).join('\n');

    const reply = await chatbotReply(message.trim(), conversationHistory || [], tourContext);

    // Persist log non-blockingly
    ChatbotConversation.create({
      userId: req.user.id,
      message: message.trim(),
      reply
    }).catch(err => console.error('Chatbot log failed:', err.message));

    res.status(200).json({
      success: true,
      message: 'Reply generated',
      data: { reply }
    });
  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Chatbot unavailable' });
  }
};
