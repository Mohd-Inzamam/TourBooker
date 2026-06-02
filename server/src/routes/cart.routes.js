const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  cartCheckout,
  getCartCount,
  removeStaleItems
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('user'));

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:itemId', updateCartItem);
router.delete('/item/:itemId', removeCartItem);
router.delete('/stale', removeStaleItems);
router.delete('/clear', clearCart);
router.get('/count', getCartCount);
router.post('/checkout', cartCheckout);

module.exports = router;
