const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:resettoken', authController.resetPassword);

// Protected routes (require authentication)
router.get('/me', protect, authController.getMe);
router.get('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;

