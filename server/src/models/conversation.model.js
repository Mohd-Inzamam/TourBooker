const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
  lastMessage: { type: String },
  lastMessageAt: { type: Date },
  lastMessageBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isReadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);
