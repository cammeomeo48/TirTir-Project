const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth');

// All cart routes require authentication
router.post('/add', protect, cartController.addToCart);
router.get('/', protect, cartController.getCart);

module.exports = router;

