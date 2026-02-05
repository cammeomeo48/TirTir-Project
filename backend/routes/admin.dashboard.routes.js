const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { 
    getStats, 
    getRevenueChart, 
    getTopProducts, 
    getCustomerStats, 
    getAllOrders 
} = require('../controllers/admin.dashboard.controller');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', getStats);

// GET /api/admin/dashboard/revenue
router.get('/dashboard/revenue', getRevenueChart);

// GET /api/admin/dashboard/top-products
router.get('/dashboard/top-products', getTopProducts);

// GET /api/admin/dashboard/customers
router.get('/dashboard/customers', getCustomerStats);

// GET /api/admin/orders
router.get('/orders', getAllOrders);

module.exports = router;
