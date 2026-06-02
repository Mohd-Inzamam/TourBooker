const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { handleValidationErrors } = require('../middlewares/validation.middleware');
const { calculatePrice, validatePromo, getPricingRules, createPricingRule, updatePricingRule, deletePricingRule, getOperatorPromotions, getAllPromotions, createPromotion, updatePromotion, deletePromotion } = require('../controllers/pricing.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Public / Semi-public
router.post(
  '/calculate',
  [
    check('tourId', 'Tour selection is required').not().isEmpty(),
    check('date', 'Valid date is required').isISO8601(),
    handleValidationErrors
  ],
  calculatePrice
);
router.post('/validate-promo', protect, validatePromo);

// Operator rules
router.get('/rules', protect, authorizeRoles('operator'), getPricingRules);
router.post(
  '/rules',
  protect,
  authorizeRoles('operator'),
  [
    check('name', 'Rule name is required').not().isEmpty(),
    check('type', 'Valid rule type is required').isIn(['seasonal', 'demand', 'dayofweek', 'earlybird', 'lastminute']),
    check('adjustmentValue', 'Adjustment value is required').not().isEmpty(),
    handleValidationErrors
  ],
  createPricingRule
);
router.put('/rules/:id', protect, authorizeRoles('operator'), updatePricingRule);
router.delete('/rules/:id', protect, authorizeRoles('operator'), deletePricingRule);

// Operator promotions query
router.get('/promotions/my', protect, authorizeRoles('operator'), getOperatorPromotions);

// Admin promotions
router.get('/promotions', protect, authorizeRoles('admin'), getAllPromotions);
router.post(
  '/promotions',
  protect,
  authorizeRoles('admin'),
  [
    check('code', 'Promo code is required')
      .trim()
      .isLength({ min: 3, max: 20 })
      .matches(/^[A-Z0-9\-]+$/),
    check('discountValue', 'Discount value is required').not().isEmpty(),
    check('discountType', 'Discount type must be percentage or fixed').isIn(['percentage', 'fixed']),
    handleValidationErrors
  ],
  createPromotion
);
router.put('/promotions/:id', protect, authorizeRoles('admin'), updatePromotion);
router.delete('/promotions/:id', protect, authorizeRoles('admin'), deletePromotion);

module.exports = router;
