const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadAvatar: uploadMiddleware } = require('../middlewares/upload.middleware');
const {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} = require('../controllers/user.controller');

/**
 * User Profile & Address Management Routes
 * All routes are protected - require authentication
 */

// ===== PROFILE ROUTES =====
router.route('/profile')
    .get(protect, getProfile)        // Get user profile
    .put(protect, updateProfile);     // Update user profile

router.post('/change-password', protect, changePassword);  // Change password

// Avatar upload route
router.post('/avatar/upload', protect, uploadMiddleware, uploadAvatar);  // Upload avatar

// ===== ADDRESS ROUTES =====
router.route('/addresses')
    .get(protect, getAddresses)       // Get all addresses
    .post(protect, addAddress);       // Add new address

router.route('/addresses/:id')
    .put(protect, updateAddress)      // Update specific address
    .delete(protect, deleteAddress);  // Delete specific address

router.patch('/addresses/:id/set-default', protect, setDefaultAddress);  // Set default address

module.exports = router;
