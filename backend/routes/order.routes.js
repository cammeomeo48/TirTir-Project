const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middlewares/auth');

// All order routes require authentication
// Tạo đơn hàng mới
router.post('/create', protect, orderController.createOrder);

// Xem lịch sử đơn hàng
router.get('/my-orders', protect, orderController.getMyOrders);

// Xem chi tiết đơn
router.get('/:id', protect, orderController.getOrderById);

// Admin: Cập nhật trạng thái (Requires admin role)
router.put('/update-status', protect, authorize('admin'), orderController.updateOrderStatus);

module.exports = router;
