const axios = require('axios');

const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

/**
 * @route   POST /api/v1/chat
 * @desc    Process a chatbot message via FastAPI AI Microservice.
 *          Model is loaded ONCE in FastAPI — no per-request Python spawn overhead.
 * @access  Public
 */
exports.chatWithBot = async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung tin nhắn.' });
    }

    try {
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

        if (response.data.success) {
            return res.json(response.data.data);
        }

        return res.status(500).json({
            success: false,
            message: response.data.error || 'AI Service returned failure',
        });

    } catch (error) {
                message: 'AI Chatbot Service chưa chạy. Vui lòng khởi động chatbot service (port 8001).',
        }
        // Request timed out
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'AI Chatbot đang quá tải, vui lòng thử lại sau.',
            });
        }
        // FastAPI returned 4xx/5xx (e.g. CSV not found)
        if (error.response) {
            return res.status(error.response.status >= 500 ? 502 : 400).json({
                success: false,
                message: error.response.data?.detail || 'Lỗi Chatbot Service',
            });
        }

        console.error('Chat Controller Error:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống AI.' });
    }
};

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        
        // Gọi sang Python Chatbot Service
        const aiResponse = await axios.post('http://chatbot:8001/chat', {
            message: message
        });

        res.status(200).json({
            success: true,
            data: aiResponse.data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Chatbot service down" });
    }
};