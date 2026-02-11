const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect, optionalProtect } = require('../middlewares/auth');

/**
 * @route   POST /api/ai/analyze-face
 * @desc    Analyze skin using Python AI
 * @access  Public (Optional Auth for history)
 */
router.post('/analyze-face', optionalProtect, aiController.analyzeFace);
router.post('/recommend-routine', aiController.recommendRoutine);
router.get('/history', protect, aiController.getHistory);

// Legacy/Alternative
router.post('/analyze-skin', aiController.analyzeSkin);
router.get('/health', aiController.healthCheck);

module.exports = router;
