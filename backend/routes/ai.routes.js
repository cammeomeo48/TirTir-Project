const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

/**
 * @route   POST /api/ai/analyze-skin
 * @desc    Analyze skin using Gemini Vision AI
 * @access  Public
 */
router.post('/analyze-skin', aiController.analyzeSkin);

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health
 * @access  Public
 */
router.get('/health', aiController.healthCheck);

module.exports = router;
