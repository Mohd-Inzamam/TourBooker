const express = require('express');
const { getRecommendationsForUser, chatWithBot } = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

// Entire logic boundary necessitates native user-level authentication completely cleanly
router.use(protect);
router.use(authorizeRoles('user', 'operator', 'admin'));

// Smart Recommendation Engine
router.get('/recommendations', getRecommendationsForUser);

// Interactive Language Application Context Engine
router.post('/chat', chatWithBot);

module.exports = router;
