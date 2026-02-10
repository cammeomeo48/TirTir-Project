const express = require('express');
const router = express.Router();
const {
    createCoupon,
    getAllCoupons,
    getActiveCoupons,
    validateCoupon,
    applyCoupon,
    updateCoupon,
    deleteCoupon
} = require('../controllers/coupon.controller');

const { protect, authorize } = require('../middlewares/auth');

// Public routes
router.get('/active', getActiveCoupons);
router.post('/validate', validateCoupon);

// Protected routes (require authentication)
router.post('/apply', protect, applyCoupon);

// Admin routes (require authentication + admin role)
router.post('/', protect, authorize('admin'), createCoupon);
router.get('/', protect, authorize('admin'), getAllCoupons);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
