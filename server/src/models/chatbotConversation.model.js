const mongoose = require('mongoose');

const chatbotConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    reply: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure index exists to map User's conversation history natively
chatbotConversationSchema.index({ userId: 1 });

module.exports = mongoose.model('ChatbotConversation', chatbotConversationSchema);
