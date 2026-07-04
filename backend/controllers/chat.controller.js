const axios = require('axios');
const mongoose = require('mongoose');
const ChatHistory = require('../models/chat.history.model');
const Coupon = require('../models/coupon.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

async function getRecentConversationHistory(userId, limit = 5) {
    if (!userId) {
        return [];
    }

    try {
        const chatDoc = await ChatHistory.findOne({ user: userId })
            .select('messages')
            .lean();

        const recentMessages = (chatDoc?.messages || []).slice(-limit);
        return recentMessages
            .filter((msg) => msg?.text && msg?.sender)
            .map((msg) => ({
                role: msg.sender === 'user' ? 'user' : 'bot',
                content: String(msg.text || '').trim(),
            }))
            .filter((msg) => msg.content.length > 0);
    } catch (err) {
        console.error('[CHAT] Failed to load conversation history:', err.message);
        return [];
    }
}

async function getActiveCoupons(limit = 10) {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            active: true,
            validFrom: { $lte: now },
            validTo: { $gte: now },
            $expr: { $lt: ['$usedCount', '$usageLimit'] },
        })
            .select('code discountType discountValue minOrderValue maxDiscount validTo usedCount usageLimit')
            .sort({ validTo: 1 })
            .limit(limit)
            .lean();

        return (coupons || []).map((coupon) => ({
            code: coupon.code,
            discount_type: coupon.discountType,
            discount_value: coupon.discountValue,
            min_order_value: coupon.minOrderValue || 0,
            max_discount: coupon.maxDiscount ?? null,
            valid_to: coupon.validTo,
            remaining_uses: Math.max(0, (coupon.usageLimit || 0) - (coupon.usedCount || 0)),
        }));
    } catch (err) {
        console.error('[CHAT] Failed to load active coupons:', err.message);
        return [];
    }
}

function extractOrderCode(message = '') {
    if (!message) {
        return null;
    }

    const orderIntentRegex = /(đơn\s*hàng|mã\s*đơn|kiểm\s*tra\s*đơn|kiem\s*tra\s*don|order|tracking)/i;
    if (!orderIntentRegex.test(message)) {
        return null;
    }

    const explicitPattern = /(?:mã\s*đơn|ma\s*don|order\s*(?:id|code)?|tracking\s*(?:id|code)?|đơn\s*hàng)\s*[:#-]?\s*([A-Za-z0-9-]{6,40})/i;
    const explicitMatch = message.match(explicitPattern);
    if (explicitMatch?.[1]) {
        return explicitMatch[1].trim();
    }

    const fallbackCandidates = message.match(/[A-Za-z0-9-]{8,40}/g) || [];
    return fallbackCandidates.length > 0 ? fallbackCandidates[fallbackCandidates.length - 1] : null;
}

function extractOrderCodeFromHistory(conversationHistory = []) {
    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        return null;
    }

    const explicitCodeRegex = /(ORD-[A-Za-z0-9-]{3,40}|GHN-[A-Za-z0-9-]{3,40}|GHN\d{6,}|[a-fA-F0-9]{24})/;

    for (let idx = conversationHistory.length - 1; idx >= 0; idx -= 1) {
        const content = String(conversationHistory[idx]?.content || '').trim();
        if (!content) continue;

        const explicitMatch = content.match(explicitCodeRegex);
        if (explicitMatch?.[1]) {
            return explicitMatch[1].trim();
        }

        const inferred = extractOrderCode(content);
        if (inferred) {
            return inferred;
        }
    }

    return null;
}

async function getOrderStatusContext(orderCode, userId) {
    if (!orderCode || !userId) {
        return null;
    }

    try {
        const queryOptions = [
            { user: userId, trackingNumber: orderCode },
            { user: userId, ghnOrderCode: orderCode },
        ];

        if (mongoose.Types.ObjectId.isValid(orderCode)) {
            queryOptions.unshift({ user: userId, _id: new mongoose.Types.ObjectId(orderCode) });
        }

        const order = await Order.findOne({ $or: queryOptions })
            .select('_id status orderStatus trackingNumber ghnOrderCode expectedDeliveryDate updatedAt createdAt totalAmount')
            .lean();

        if (!order) {
            return {
                order_code: orderCode,
                found: false,
            };
        }

        return {
            order_code: orderCode,
            found: true,
            order_id: String(order._id),
            status: order.status,
            shipping_status: order.orderStatus,
            tracking_number: order.trackingNumber || null,
            ghn_order_code: order.ghnOrderCode || null,
            expected_delivery_date: order.expectedDeliveryDate || null,
            updated_at: order.updatedAt,
            created_at: order.createdAt,
            total_amount: order.totalAmount,
        };
    } catch (err) {
        console.error('[CHAT] Failed to load order status:', err.message);
        return null;
    }
}

async function buildDynamicContext(message, userId, conversationHistory = []) {
    const dynamicContext = {
        active_coupons: [],
        order_status: null,
    };

    const couponIntentRegex = /(mã\s*giảm\s*giá|ma\s*giam\s*gia|voucher|coupon|khuyến\s*mãi|khuyen\s*mai|ưu\s*đãi|uu\s*dai)/i;
    const orderCode = extractOrderCode(message) || extractOrderCodeFromHistory(conversationHistory);

    if (couponIntentRegex.test(message || '')) {
        dynamicContext.active_coupons = await getActiveCoupons(10);
    }

    if (orderCode) {
        dynamicContext.order_status = await getOrderStatusContext(orderCode, userId);
    }

    return dynamicContext;
}

/**
 * @route   POST /api/v1/chat
 * @desc    Process a chatbot message via FastAPI AI Microservice.
 *          Uses optionalProtect: guests pass through, logged-in users
 *          get their conversation auto-saved to MongoDB.
 * @access  Public (guests allowed; authenticated users get DB persistence)
 */
exports.chatWithBot = async (req, res) => {
    const { message, productId } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung tin nhắn.' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured.");
        }
        console.log(`[CHAT] GEMINI_API_KEY loaded. Length: ${apiKey.length}`);
        
        const genAI = new GoogleGenerativeAI(apiKey);

        // 1. Lấy thông tin User (nếu đã login)
        let skinType = 'Không rõ';
        let knownAllergies = [];
        if (req.user) {
            const User = mongoose.model('User');
            const userDoc = await User.findById(req.user._id).lean();
            if (userDoc) {
                if (userDoc.skinProfile?.skinType) skinType = userDoc.skinProfile.skinType;
                if (userDoc.knownAllergies) knownAllergies = userDoc.knownAllergies;
            }
        }

        // 2. Fetch Product Context (nếu user đang xem 1 SP cụ thể)
        let productInfoStr = '';
        if (productId) {
            try {
                const product = await Product.findById(productId).lean();
                if (product) {
                    const ingredients = Array.isArray(product.ingredients) ? product.ingredients.join(', ') : product.ingredients || 'Không rõ';
                    productInfoStr = `Tên: ${product.name}, Thành phần: ${ingredients}.`;
                }
            } catch (err) {
                console.error('[CHAT] Product context fetch error:', err.message);
            }
        }

        // 3. Lấy danh sách sản phẩm active để làm gợi ý
        let productsListText = '';
        try {
            const products = await Product.find({ isActive: true })
                .select('_id name category price')
                .limit(20)
                .lean();
            productsListText = products.map(p => `- ID: ${p._id} | Tên: ${p.name} | Loại: ${p.category}`).join('\n');
        } catch (err) {
            console.error('[CHAT] Fetch active products error:', err.message);
        }

        // 4. Lịch sử hội thoại & Dynamic Context
        const sessionId = req.user?._id?.toString() || `guest:${req.ip || 'unknown'}`;
        const conversationHistory = await getRecentConversationHistory(req.user?._id, 5);
        const dynamicContext = await buildDynamicContext(message.trim(), req.user?._id, conversationHistory);
        let historyText = conversationHistory.map(msg => `${msg.role === 'user' ? 'Khách' : 'Bot'}: ${msg.content}`).join('\n');

        const systemPrompt = `Bạn là chuyên gia tư vấn da liễu của TirTir.
Nhiệm vụ của bạn là tư vấn mỹ phẩm.
Người dùng hiện tại có loại da: ${skinType}.
Dị ứng đã biết: ${knownAllergies.length > 0 ? knownAllergies.join(', ') : 'Không có'}.
Lịch sử chat gần đây:
${historyText}

Context sản phẩm đang xem (nếu có):
${productInfoStr}

Danh sách sản phẩm gợi ý (chỉ chọn từ ID trong này):
${productsListText}

Thông tin Đơn hàng / Mã giảm giá (Dynamic Context):
${JSON.stringify(dynamicContext, null, 2)}

Bạn phải phản hồi ở định dạng JSON với các khóa chính xác sau:
{
    "reply": "câu trả lời của bạn (ngắn gọn, thân thiện, tiếng Việt)",
    "detectedSkinType": "loại da bạn đoán (Oily, Dry, Combination, Sensitive) hoặc null",
    "recommendedProductIds": ["id1", "id2"],
    "intent": "consultation" // hoặc order, coupon, greeting
}
TUYỆT ĐỐI KHÔNG DÙNG THẺ MARKDOWN. TRẢ VỀ CHUỖI JSON HỢP LỆ.`;

        // 5. Chuẩn bị SSE Response
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        if (typeof res.flushHeaders === 'function') {
            res.flushHeaders();
        }

        const writeSse = (eventName, payload) => {
            res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        // 6. Gọi Gemini với Retry + Fallback Models
        let rawResponseText = "";
        const callGeminiWithRetry = async (retries = 1, timeoutMs = 5000) => {
            const modelsToTry = [
                { name: 'gemini-2.5-flash', useJson: true },
                { name: 'gemini-2.0-flash', useJson: true },
                { name: 'gemini-flash-latest', useJson: true },
                { name: 'gemini-pro-latest', useJson: false }
            ];

            for (let m = 0; m < modelsToTry.length; m++) {
                const currentModelConfig = modelsToTry[m];
                const model = genAI.getGenerativeModel({
                    model: currentModelConfig.name,
                    ...(currentModelConfig.useJson && { generationConfig: { responseMimeType: 'application/json' } })
                });

                for (let attempt = 0; attempt <= retries; attempt++) {
                    try {
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Timeout')), timeoutMs);
                        });

                        const prompt = `Tin nhắn của khách hàng: "${message.trim()}"\nTUYỆT ĐỐI KHÔNG sử dụng thẻ markdown \`\`\`json. Chỉ trả về chuỗi JSON thuần tuý hợp lệ.`;
                        const geminiCall = (async () => {
                            const result = await model.generateContent([
                                { text: systemPrompt },
                                { text: prompt }
                            ]);
                            return result.response.text();
                        })();

                        rawResponseText = await Promise.race([geminiCall, timeoutPromise]);
                        return rawResponseText; // Success!
                    } catch (err) {
                        console.error(`[CHAT] Model ${currentModelConfig.name} attempt ${attempt + 1} failed:`, err.message);
                        
                        // Nếu bị 404 (Model not found) -> Bỏ qua retry, chuyển ngay sang model tiếp theo
                        if (err.status === 404 || (err.message && err.message.includes('404'))) {
                            break; 
                        }

                        // Các lỗi fatal khác (400, 401, 403) -> Văng lỗi luôn, không cứu được
                        if (attempt === retries || err.status === 400 || err.status === 401 || err.status === 403) {
                            if (m === modelsToTry.length - 1) throw err; // Hết model để thử rồi
                        }
                    }
                }
            }
            throw new Error("All Gemini models failed or were not found.");
        };

        rawResponseText = await callGeminiWithRetry(1, 5000);

        // 7. Strip Markdown
        let cleanJsonString = rawResponseText.trim();
        if (cleanJsonString.startsWith('```json')) {
            cleanJsonString = cleanJsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanJsonString.startsWith('```')) {
            cleanJsonString = cleanJsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        let chatbotReply;
        try {
            chatbotReply = JSON.parse(cleanJsonString.trim());
        } catch (e) {
            console.error('[CHAT] Failed to parse Gemini response:', cleanJsonString);
            throw new Error("Invalid JSON from Gemini");
        }

        const replyText = chatbotReply.reply || "Xin lỗi, tôi không thể trả lời lúc này.";
        
        // 8. Stream kết quả trả về như cũ (event: chunk -> event: done)
        const words = replyText.split(' ');
        for (const word of words) {
            writeSse('chunk', { text: word + ' ' });
            await new Promise(r => setTimeout(r, 20)); // Delay tạo hiệu ứng gõ phím
        }

        const donePayload = {
            success: true,
            message: replyText,
            data: {
                intent: chatbotReply.intent || 'consultation',
                message: replyText,
                data: { recommendations: chatbotReply.recommendedProductIds || [] },
                type: 'text'
            }
        };
        writeSse('done', donePayload);

        // 9. Lưu vào DB nếu có req.user
        if (req.user) {
            const userMsg = { text: message.trim(), sender: 'user', timestamp: new Date() };
            const botMsg = { 
                text: replyText, 
                sender: 'bot', 
                timestamp: new Date(),
                intent: chatbotReply.intent || 'consultation'
            };
            await saveMessagesToDB(req.user._id, userMsg, botMsg);
            
            // Cập nhật lại SkinType nếu bot đoán ra
            if (chatbotReply.detectedSkinType && chatbotReply.detectedSkinType !== "null") {
                const User = mongoose.model('User');
                await User.findByIdAndUpdate(req.user._id, {
                    "skinProfile.skinType": chatbotReply.detectedSkinType
                });
            }
        }

        res.end();

    } catch (error) {
        console.error('========== [CHAT] FATAL ERROR ==========');
        console.error('Message:', error.message);
        console.error('Status/Code:', error.status || error.code);
        console.error('Response Data:', error.response ? JSON.stringify(error.response.data) : 'N/A');
        console.error('Stack Trace:', error.stack);
        console.error('=========================================');
        
        let errorMsg = `DEBUG ERROR: ${error.message}`;
        if (error.message === 'Timeout') {
            errorMsg = "Xin lỗi, hệ thống AI đang quá tải. Bạn có thể hỏi lại sau.";
        }
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
        }
        res.write(`event: error\ndata: ${JSON.stringify({ success: false, message: errorMsg })}\n\n`);
        res.end();
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