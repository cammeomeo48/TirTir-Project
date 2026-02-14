const express = require('express');
const router = express.Router();

// Import controllers
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

// Import middleware
const { protect, authorize } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { validate } = require('../middlewares/validate');

/**
 * ===== AUTHENTICATION ROUTES =====
 * Clean, RESTful API design for TirTir Cosmetics Platform
 */

// ===== PUBLIC ROUTES (No authentication required) =====

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user with email verification
 * @access  Public
 */
// Apply Rate Limiting to Login/Register
router.post('/register', authLimiter, registerValidator, validate, register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', authLimiter, loginValidator, validate, login);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify user email (redirects to frontend)
 * @access  Public
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   PUT /api/v1/auth/reset-password/:resettoken
 * @desc    Reset user password with token
 * @access  Public
 */
router.put('/reset-password/:resettoken', resetPassword);

// ===== PROTECTED ROUTES (Require authentication) =====

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user info
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   GET /api/v1/auth/logout
 * @desc    Logout current user
 * @access  Private
 */
router.get('/logout', protect, logout);

// ===== FUTURE IMPLEMENTATION =====

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh JWT token (placeholder)
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

module.exports = router;
