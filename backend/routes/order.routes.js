const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middlewares/auth');

// --- CÁC ROUTE KHÔNG CÓ PARAM ID ---
// Tạo đơn hàng mới
router.post('/create', protect, orderController.createOrder);

// Xem lịch sử đơn hàng
router.get('/my-orders', protect, orderController.getMyOrders);

// Admin & Staff: Cập nhật trạng thái
router.put('/update-status', protect, authorize('admin', 'customer_service', 'inventory_staff'), orderController.updateOrderStatus);

// --- CÁC ROUTE CÓ PARAM ID (QUAN TRỌNG: PHẢI ĐẶT TRƯỚC /:id) ---

// 1. Tracking (Có thể để public hoặc protect tùy bạn, ở đây mình để public cho dễ test)
router.get('/:id/tracking', orderController.getOrderTracking);

// 2. Cancel Order (Cần login)
router.post('/:id/cancel', protect, orderController.cancelOrder);

// 3. Reorder (Cần login)
router.post('/:id/reorder', protect, orderController.reorder);

// --- ROUTE GENERIC (ĐẶT CUỐI CÙNG) ---
// Xem chi tiết đơn (Nếu đặt cái này lên trên, nó sẽ nuốt mất các route /:id/... ở trên)
router.get('/:id', protect, orderController.getOrderById);

module.exports = router;
