const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { uploadProductImage: productMiddleware, uploadBanner: bannerMiddleware } = require('../middlewares/upload.middleware');
const { uploadProductImage, uploadBanner } = require('../controllers/upload.controller');

// Upload Product Image (Admin only)
router.post('/product', protect, authorize('admin'), productMiddleware, uploadProductImage);

// Upload Banner Image (Admin only)
router.post('/banner', protect, authorize('admin'), bannerMiddleware, uploadBanner);

module.exports = router;
