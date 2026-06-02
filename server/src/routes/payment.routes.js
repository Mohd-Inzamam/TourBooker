const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { createPaymentIntent, handleWebhook, verifyPayment, getPaymentHistory } = require('../controllers/payment.controller');
const { confirmDemoPaymentIntent } = require('../controllers/demoPayment.controller');

router.post('/create-intent', protect, createPaymentIntent);
router.get('/history', protect, getPaymentHistory);
router.get('/verify/:paymentIntentId', protect, verifyPayment);
router.post('/demo-confirm', protect, confirmDemoPaymentIntent);
router.post('/webhook', handleWebhook); // Called strictly by Stripe Webhooks (no custom auth)

module.exports = router;
