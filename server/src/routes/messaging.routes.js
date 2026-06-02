const express = require('express');
const { 
  getConversations, 
  getOrCreateConversation, 
  getMessages, 
  sendMessage, 
  getUnreadCount, 
  closeConversation,
  inquiry
} = require('../controllers/messaging.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

// All messaging routes require authentication
router.use(protect);

// Routes available to all authenticated users
router.get('/', getConversations);
router.post('/start', getOrCreateConversation);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/send', sendMessage);
router.get('/unread-count', getUnreadCount);

// Close conversation: only operators and admins can close
router.put('/:conversationId/close', authorizeRoles('operator', 'admin'), closeConversation);

// Tour inquiry: only users can send inquiries (operators and admins use /start instead)
router.post('/inquiry', authorizeRoles('user'), inquiry);

module.exports = router;
