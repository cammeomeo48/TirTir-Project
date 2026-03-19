const axios = require('axios');
const ChatHistory = require('../models/chat.history.model');

const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

// ─── Helper: persist a pair of messages to the user's ChatHistory ────────────
async function saveMessagesToDB(userId, userMsg, botMsg) {
    try {
        await ChatHistory.findOneAndUpdate(
            { user: userId },
            {
                $push: {
                    messages: {
                        $each: [userMsg, botMsg],
                        // Keep at most 200 messages to cap doc size
                        $slice: -200,
                    }
                }
            },
            { upsert: true, new: true }
        );
    } catch (err) {
        // Non-fatal — log but don't break the response
        console.error('[CHAT] Failed to persist messages to DB:', err.message);
    }
}

/**
 * @route   POST /api/v1/chat
 * @desc    Process a chatbot message via FastAPI AI Microservice.
 *          Uses optionalProtect: guests pass through, logged-in users
 *          get their conversation auto-saved to MongoDB.
 * @access  Public (guests allowed; authenticated users get DB persistence)
 */
exports.chatWithBot = async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung tin nhắn.' });
    }

    try {
        console.log(`[CHAT] Sending request to ${CHATBOT_SERVICE_URL}/chat with message: "${message.trim()}"`);

        const response = await axios.post(
            `${CHATBOT_SERVICE_URL}/chat`,
            { message: message.trim() },
            {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    ...(AI_SERVICE_API_KEY && { 'X-API-Key': AI_SERVICE_API_KEY })
                }
            }
        );

        console.log(`[CHAT] FastAPI response received:`, response.status, response.data);

        if (response.data.success) {
            const botData = response.data.data;

            // ── Persist to DB for authenticated users (optionalProtect attaches req.user) ──
            if (req.user) {
                const userMsg = {
                    text: message.trim(),
                    sender: 'user',
                    timestamp: new Date(),
                };
                const botMsg = {
                    text: botData.message,
                    sender: 'bot',
                    timestamp: new Date(),
                    ...(botData.type === 'product' && botData.data
                        ? { productData: botData.data }
                        : {})
                };
                // Fire-and-forget — don't await so it doesn't delay the API response
                saveMessagesToDB(req.user._id, userMsg, botMsg);
            }

            return res.json(botData);
        }

        return res.status(500).json({
            success: false,
            message: response.data.error || 'AI Service returned failure',
        });

    } catch (error) {
        // ── Detailed diagnostics — always log so nothing is swallowed ──────────
        console.error('[CHAT] AI SERVICE ERROR DETAILS:', {
            code:        error.code,
            message:     error.message,
            targetUrl:   `${CHATBOT_SERVICE_URL}/chat`,
            httpStatus:  error.response?.status,
            httpBody:    error.response?.data,
        });

        // Network error → chatbot service not running
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                success: false,
                message: `AI Chatbot Service chưa chạy. Hãy khởi động service tại ${CHATBOT_SERVICE_URL}`,
            });
        }
        // Request timed out
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'AI Chatbot đang quá tải, vui lòng thử lại sau.',
            });
        }
        // FastAPI returned 4xx/5xx — forward the detail message
        if (error.response) {
            return res.status(error.response.status >= 500 ? 502 : 400).json({
                success: false,
                message: error.response.data?.detail || 'Lỗi Chatbot Service',
            });
        }

        console.error('[CHAT] Unexpected error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống AI.' });
    }
};

/**
 * @route   GET /api/v1/chat/history
 * @desc    Fetch authenticated user's full chat history from MongoDB.
 * @access  Private (JWT required)
 */
exports.getChatHistory = async (req, res) => {
    try {
        const chatDoc = await ChatHistory.findOne({ user: req.user._id })
            .select('messages')
            .lean();

        // Return empty array if the user has never chatted before
        const messages = chatDoc?.messages ?? [];

        return res.json({
            success: true,
            data: messages,
        });
    } catch (error) {
        console.error('[CHAT] getChatHistory error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to load chat history.' });
    }
};

/**
 * @route   DELETE /api/v1/chat/history
 * @desc    Clear the authenticated user's chat history.
 * @access  Private (JWT required)
 */
exports.clearChatHistory = async (req, res) => {
    try {
        await ChatHistory.findOneAndUpdate(
            { user: req.user._id },
            { $set: { messages: [] } }
        );
        return res.json({ success: true, message: 'Chat history cleared.' });
    } catch (error) {
        console.error('[CHAT] clearChatHistory error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to clear chat history.' });
    }
};