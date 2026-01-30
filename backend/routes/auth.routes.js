const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
    refreshToken
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);  // Email verification
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.post('/refresh-token', refreshToken);

module.exports = router;
