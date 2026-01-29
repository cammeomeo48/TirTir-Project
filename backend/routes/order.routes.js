const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Tạo đơn hàng mới
router.post('/create', orderController.createOrder);

// Xem lịch sử đơn hàng
router.get('/my-orders', orderController.getMyOrders);

// Xem chi tiết đơn
router.get('/:id', orderController.getOrderById);

module.exports = router;