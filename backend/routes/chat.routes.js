const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// POST /api/chat
router.post('/', chatController.chatWithBot);

module.exports = router;