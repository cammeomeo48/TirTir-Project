const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middlewares/auth');

// Public/Client Routes
router.post('/validate-cart', inventoryController.validateCart);

// Admin Routes
router.get('/alerts', protect, authorize('admin'), inventoryController.getInventoryAlerts);
router.get('/logs', protect, authorize('admin'), inventoryController.getStockLogs);
router.patch('/adjust', protect, authorize('admin'), inventoryController.adjustStock);
router.post('/cleanup', protect, authorize('admin'), inventoryController.cleanupPendingOrders);

module.exports = router;
