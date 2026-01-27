const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// Ideally protected by Auth Middleware, but keeping open for now as per minimal reqs, expect userId in body/query
router.post('/add', cartController.addToCart);
router.get('/', cartController.getCart);

module.exports = router;
