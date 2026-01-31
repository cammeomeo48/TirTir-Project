const express = require('express');
const router = express.Router();
const {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth');

// Apply protection to all cart routes
router.use(protect);

router.post('/add', addToCart);
router.get('/', getCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId/:shade', removeFromCart);
router.delete('/clear', clearCart);
router.get('/count', getCartCount);

module.exports = router;
