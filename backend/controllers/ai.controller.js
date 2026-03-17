const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const AiAnalysis = require('../models/ai_analysis.model');
const User = require('../models/user.model');
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

        // 2. Save to History + Update skinProfile snapshot (if user logged in)
        if (req.user) {
            // Save full analysis record
            await AiAnalysis.create({
                user: req.user.id,
                imageUrl: 'ai_analysis_result',
                analysisResult: {
                    skinTone:   analysisResult.skinTone,
                    undertone:  analysisResult.undertone,
                    skinType:   analysisResult.skinType,
                    concerns:   analysisResult.concerns || [],
                    confidence: analysisResult.confidence
                }
            });

            // Update quick-access skinProfile snapshot on User doc
            await User.findByIdAndUpdate(req.user.id, {
                skinProfile: {
                    skinTone:       analysisResult.skinTone,
                    undertone:      analysisResult.undertone,
                    skinType:       analysisResult.skinType,
                    concerns:       analysisResult.concerns || [],
                    confidence:     analysisResult.confidence,
                    lastAnalyzedAt: new Date()
                }
            });
        }

        res.json({
            success: true,
            data: analysisResult,
            saved: !!req.user // let frontend know if it was saved
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
        let { skinType, concerns, skinTone, undertone } = req.body;

        // Fallback: if no body data but user has saved profile → use it
        if ((!skinType || !skinTone) && req.user) {
            const user = await User.findById(req.user.id).select('skinProfile');
            if (user?.skinProfile?.skinTone) {
                skinTone  = user.skinProfile.skinTone;
                skinType  = user.skinProfile.skinType || 'Normal';
                undertone = user.skinProfile.undertone;
                concerns  = user.skinProfile.concerns;
                console.log(`[AI] Using saved skin profile for user ${req.user.id}`);
            }
        }

        // 1. Validate Input
        if (!skinType || !skinTone) {
            return res.status(400).json({ success: false, message: 'Missing skin analysis data. Please scan first.' });
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
        // Build product list for prompt context (Gemini recommends steps, backend picks real products)
        const productListStr = products.map(p =>
            `- Category: ${p.Category}, Name: ${p.Name}`
        ).join('\n');

        const prompt = `
You are a professional licensed dermatologist and skincare advisor for TirTir — a premium Korean beauty brand.

A customer's skin has been analyzed by our AI scanner. Create a personalized skincare routine for this customer.

CUSTOMER SKIN PROFILE:
- Skin Type: ${skinType}
- Skin Tone: ${skinTone}
- Undertone: ${undertone || 'Not detected'}
- Detected Concerns: ${concerns && concerns.length > 0 ? concerns.join(', ') : 'None'}

AVAILABLE PRODUCT CATEGORIES: Cleanser, Toner, Serum, Cream, Sunscreen, Cushion

INSTRUCTIONS:
1. Select 3 to 5 routine steps from the available categories.
2. For each step, provide a clinical reason and an application tip for this specific skin type.
3. Write a dermatologist_note: a 2-sentence clinical assessment.
4. Write expert_advice: a 1-2 sentence routine summary.
5. Estimate current skin metrics (0-100) and predict after 28 days of use.
6. Return ONLY a raw JSON object — no Markdown, no code blocks:

{
  "routine": [
    {
      "step": "Category name exactly as listed above (e.g. Cleanser, Toner, Serum)",
      "reason": "Clinical reason why this step suits this skin profile",
      "application_tip": "How to apply correctly for this skin type"
    }
  ],
  "expert_advice": "1-2 sentence summary",
  "dermatologist_note": "2-sentence clinical assessment",
  "skin_metrics": {
    "hydration": 0,
    "elasticity": 0,
    "pigmentation": 0,
    "texture": 0,
    "sensitivity": 0
  },
  "skin_evolution": {
    "current": { "hydration": 0, "texture": 0 },
    "predicted": { "hydration": 0, "texture": 0 }
  }
}`;

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
            console.log('Falling back to Heuristic Recommendation');
            const routine = [];
            const findP = (cat) => products.find(p => p.Category === cat && (p.Skin_Type_Target?.includes(skinType) || p.Main_Concern?.includes(concerns?.[0])));

            const toner = findP('Toner');
            if (toner) routine.push({ step: 'Toner', product_id: toner._id, reason: `Best toner for ${skinType} skin`, application_tip: 'Apply with cotton pad after cleansing.' });
            const serum = findP('Serum');
            if (serum) routine.push({ step: 'Serum', product_id: serum._id, reason: `Targets ${concerns?.[0] || 'general skin health'}`, application_tip: 'Press gently into skin, do not rub.' });
            const cream = findP('Cream');
            if (cream) routine.push({ step: 'Cream', product_id: cream._id, reason: `Moisturizer suited for ${skinType} skin`, application_tip: 'Apply as the final step, seal in all layers.' });

            const isSensitive = skinType === 'Dry' || concerns?.includes('Redness');
            recommendationData = {
                routine,
                expert_advice: 'We recommend this routine based on your detected skin profile. For best results, follow the steps consistently morning and night.',
                dermatologist_note: `Your skin presents characteristics of ${skinType} type${ concerns?.length ? ` with notable ${concerns[0]}` : '' }. A gentle, consistent routine is the foundation of healthy skin.`,
                skin_metrics: {
                    hydration: skinType === 'Dry' ? 38 : skinType === 'Oily' ? 62 : 55,
                    elasticity: 70,
                    pigmentation: concerns?.includes('Pigmentation') ? 42 : 75,
                    texture: concerns?.includes('Acne') ? 48 : 68,
                    sensitivity: isSensitive ? 72 : 35
                },
                skin_evolution: {
                    current: { hydration: skinType === 'Dry' ? 38 : 55, texture: 52 },
                    predicted: { hydration: skinType === 'Dry' ? 60 : 72, texture: 75 }
                }
            };
        }

        // 6. Hydrate Product Details — match by category (Gemini returns category names, not product IDs)
        //    For each step Gemini recommends, pick the best real product in that category from the DB.
        const usedCategories = new Set();
        const enrichedRoutine = recommendationData.routine.map((step) => {
            const stepCat = (step.step || '').trim();

            // Find best product for this category (prefer skin type target match, then any in category)
            let product = products.find(p =>
                p.Category === stepCat &&
                !usedCategories.has(p._id.toString()) &&
                (p.Skin_Type_Target?.toLowerCase().includes(skinType.toLowerCase()) ||
                 p.Main_Concern?.toLowerCase().includes(concerns?.[0]?.toLowerCase() || ''))
            );

            // Fallback: any product in that category not yet used
            if (!product) {
                product = products.find(p =>
                    p.Category === stepCat && !usedCategories.has(p._id.toString())
                );
            }

            if (product) usedCategories.add(product._id.toString());

            return { ...step, product: product || null };
        });

        // 7. Calculate total routine price
        const routineProducts = enrichedRoutine.filter(r => r.product);
        const totalPrice = routineProducts.reduce((sum, r) => sum + (r.product?.Price || 0), 0);

        const responseData = {
            routine: routineProducts,
            advice: recommendationData.expert_advice,
            dermatologistNote: recommendationData.dermatologist_note || null,
            skinMetrics: recommendationData.skin_metrics || null,
            skinEvolution: recommendationData.skin_evolution || null,
            totalPrice,
            skinType,
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
 * @route   GET /api/v1/ai/latest-profile
 * @desc    Get the user's latest skin analysis snapshot
 * @access  Private
 */
exports.getLatestProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('skinProfile');

        if (!user?.skinProfile?.skinTone) {
            return res.json({ success: true, data: null, message: 'No skin analysis found. Please scan first.' });
        }

        // Also fetch the last 5 history records
        const history = await AiAnalysis.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('analysisResult createdAt');

        res.json({
            success: true,
            data: {
                skinProfile: user.skinProfile,
                history
            }
        });
    } catch (error) {
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
        aiServiceStatus = aiHealth.data.skin_analyzer_loaded ? 'ready' : 'loading';
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
