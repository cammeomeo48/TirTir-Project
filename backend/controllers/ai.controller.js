const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const AiAnalysis = require('../models/ai_analysis.model');
const Product = require('../models/product.model');
const { buildCacheKey, getCache, setCache } = require('../utils/redisCache');

// FastAPI AI Microservice URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

/**
 * ===== AI BEAUTY ADVISOR CONTROLLER =====
 * Uses Gemini AI Vision OR Local Python Script to analyze skin
 */

// Initialize Gemini AI (Keep existing logic as fallback or alternative)
let genAI = null;
let visionModel = null;

const initializeGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.includes('your_')) {
        // console.warn('⚠️ GEMINI_API_KEY is not configured properly!');
        return false;
    }
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        console.log('✅ Gemini AI initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error);
        return false;
    }
};

initializeGemini();

/**
 * Call FastAPI AI Microservice for skin analysis.
 * Model is pre-loaded in FastAPI — no per-request overhead.
 */
const callAIService = async (imageBase64) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/analyze`, {
            image_base64: imageBase64
        }, {
            timeout: 5000, // 5s — FastAPI should respond well within this on local/same network
            headers: {
                'Content-Type': 'application/json',
                ...(AI_SERVICE_API_KEY && { 'X-API-Key': AI_SERVICE_API_KEY })
            }
        });

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.error || 'AI Service returned failure');
        }
    } catch (error) {
        // Timeout — FastAPI is hanging/overloaded
        if (error.code === 'ECONNABORTED') {
            const err = new Error('AI Service đang quá tải, vui lòng thử lại sau.');
            err.statusCode = 504;
            throw err;
        }
        // FastAPI server is not running
        if (error.code === 'ECONNREFUSED') {
            const err = new Error('AI Service chưa chạy. Vui lòng khởi động FastAPI server (ai-service/).');
            err.statusCode = 503;
            throw err;
        }
        // FastAPI returned HTTP 4xx/5xx (e.g. model crash, bad image)
        if (error.response) {
            const status = error.response.status;
            const detail = error.response.data?.detail || error.response.data?.error || 'Lỗi không xác định';
            const err = new Error(`AI Service lỗi: ${detail}`);
            err.statusCode = status >= 500 ? 502 : 400;
            throw err;
        }
        throw error;
    }
};

/**
 * @route   GET /api/ai/history
 * @desc    Get analysis history for user
 * @access  Private
 */
exports.getHistory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const history = await AiAnalysis.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/ai/analyze-skin
 * @desc    Analyze skin using Gemini Vision API (Legacy/Alternative)
 */
exports.analyzeSkin = async (req, res) => {
    // Redirect logic to analyzeFace if python is preferred
    return exports.analyzeFace(req, res);
};

/**
 * @route   POST /api/ai/analyze-face
 * @desc    Analyze face using FastAPI AI Microservice
 * @access  Public (Save history if logged in)
 */
exports.analyzeFace = async (req, res) => {
    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({ success: false, message: 'Image data is required' });
        }

        // 1. Send base64 directly to FastAPI (no temp file needed)
        let analysisResult;
        try {
            analysisResult = await callAIService(imageData);
        } catch (err) {
            console.error('AI Service Error:', err.message);
            return res.status(err.statusCode || 500).json({
                success: false,
                message: 'AI Analysis failed',
                error: err.message
            });
        }

        // 2. Save to History (if user logged in)
        if (req.user) {
            await AiAnalysis.create({
                user: req.user.id,
                imageUrl: 'ai_analysis_result',
                analysisResult: analysisResult
            });
        }

        res.json({
            success: true,
            data: analysisResult
        });

    } catch (error) {
        console.error('Analyze Face Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/ai/recommend-routine
 * @desc    Get routine recommendations based on skin analysis using Gemini AI
 * @access  Public
 */
exports.recommendRoutine = async (req, res) => {
    try {
        const { skinType, concerns, skinTone, undertone } = req.body;

        // 1. Validate Input
        if (!skinType || !skinTone) {
            return res.status(400).json({ success: false, message: 'Missing skin analysis data' });
        }

        // === PHASE C: REDIS CACHE CHECK ===
        // Key = hash of skin profile — same result for same skin params within 24h
        const cacheKey = buildCacheKey(skinType, skinTone, undertone, concerns);
        const cached = await getCache(cacheKey);
        if (cached) {
            console.log(`⚡ Cache HIT for routine [${skinTone}/${undertone}/${skinType}]`);
            return res.json({ success: true, data: cached, fromCache: true });
        }
        console.log(`🤖 Cache MISS — calling Gemini for [${skinTone}/${undertone}/${skinType}]`);

        // 2. Fetch Products from DB
        const products = await Product.find({
            Category: { $in: ['Toner', 'Serum', 'Cream', 'Sunscreen', 'Cushion', 'Cleanser'] },
            Stock_Quantity: { $gt: 0 }
        }).select('Product_ID Name Category Description_Short Skin_Type_Target Main_Concern Price Thumbnail_Images slug');

        if (!products || products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products available for recommendation' });
        }

        // 3. Prepare Prompt for Gemini
        // We act as a Beauty Consultant. 
        // ROLE DEFINITION: Gemini acts as the "Dermatologist Brain", interpreting the raw scan data (from Python/MediaPipe) 
        // to prescribe a personalized routine.
        const productListStr = products.map(p =>
            `- ID: ${p._id}, Name: ${p.Name}, Category: ${p.Category}, For: ${p.Skin_Type_Target}, Treats: ${p.Main_Concern}`
        ).join('\n');

        const prompt = `
        You are a professional Dermatologist and Beauty Consultant for Tirtir (a Korean beauty brand).
        
        **User Profile (Detected by AI Scanner):**
        - Skin Type: ${skinType}
        - Skin Tone: ${skinTone}
        - Undertone: ${undertone || 'Unknown'}
        - Detected Concerns: ${concerns && concerns.length > 0 ? concerns.join(', ') : 'None visible'}
        
        **Task:**
        Create a personalized "Glass Skin" Skincare Routine for this user using ONLY the available products below.
        
        **Available Products:**
        ${productListStr}
        
        **Requirements:**
        1. Select exactly 3-5 key products for a morning/night routine (Cleanser -> Toner -> Serum -> Cream -> Sunscreen/Cushion).
        2. Explain WHY each product was chosen based on their specific skin analysis (e.g., "This serum helps with your detected redness...").
        3. Provide a short, encouraging "Expert Advice" paragraph at the end.
        4. Return the result in strict JSON format as follows:
        {
            "routine": [
                { "step": "Step Name", "product_id": "Mongoose_ID_Here", "reason": "Explanation" }
            ],
            "expert_advice": "Your advice here..."
        }
        Do not use Markdown formatting (like \`\`\`json). Just the raw JSON string.
        `;

        // 4. Call Gemini API
        let recommendationData;

        if (genAI && visionModel) {
            try {
                // Use the text-only model or the same vision model for text generation
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text().replace(/```json|```/g, '').trim(); // Clean up code blocks

                recommendationData = JSON.parse(text);

            } catch (aiError) {
                console.error("Gemini Generation Error:", aiError);
                // Fallback to heuristic logic if AI fails
                recommendationData = null;
            }
        }

        // 5. Fallback Logic (Heuristic) if AI is disabled or fails
        if (!recommendationData) {
            console.log("Falling back to Heuristic Recommendation");
            const routine = [];
            const findP = (cat) => products.find(p => p.Category === cat && (p.Skin_Type_Target?.includes(skinType) || p.Main_Concern?.includes(concerns?.[0])));

            const toner = findP('Toner');
            if (toner) routine.push({ step: 'Toner', product_id: toner._id, reason: `Best toner for ${skinType}` });

            const serum = findP('Serum');
            if (serum) routine.push({ step: 'Serum', product_id: serum._id, reason: `Treats ${concerns?.[0] || 'general skin health'}` });

            const cream = findP('Cream');
            if (cream) routine.push({ step: 'Cream', product_id: cream._id, reason: `Moisturizer for ${skinType}` });

            recommendationData = {
                routine: routine,
                expert_advice: "We recommend this basic routine based on your skin type. (AI Service unavailable)"
            };
        }

        // 6. Hydrate Product Details (Populate full product info based on IDs returned by AI)
        const enrichedRoutine = await Promise.all(recommendationData.routine.map(async (step) => {
            const product = products.find(p => p._id.toString() === step.product_id);
            return {
                ...step,
                product: product || null // Return full product object
            };
        }));

        const responseData = {
            routine: enrichedRoutine.filter(r => r.product),
            advice: recommendationData.expert_advice
        };

        // === PHASE C: CACHE WRITE — 24h TTL ===
        await setCache(cacheKey, responseData, 86400);
        console.log(`💾 Cached routine for [${skinTone}/${undertone}/${skinType}]`);

        res.json({ success: true, data: responseData, fromCache: false });

    } catch (error) {
        console.error('Recommend Routine Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/ai/health
 * @desc    Health check — also checks FastAPI service
 */
exports.healthCheck = async (req, res) => {
    let aiServiceStatus = 'unknown';
    try {
        const aiHealth = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
        aiServiceStatus = aiHealth.data.model_loaded ? 'ready' : 'loading';
    } catch {
        aiServiceStatus = 'offline';
    }

    res.json({
        status: 'OK',
        gemini: !!visionModel,
        aiService: aiServiceStatus,
        aiServiceUrl: AI_SERVICE_URL
    });
};
