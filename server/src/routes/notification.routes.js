const express = require('express');
const { getSummary } = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/summary', getSummary);

module.exports = router;
