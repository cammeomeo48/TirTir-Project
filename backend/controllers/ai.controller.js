const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const AiAnalysis = require('../models/ai_analysis.model');
const Product = require('../models/product.model');

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

// Helper to run Python script
const runPythonAnalysis = (imagePath) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../services/ml/skin_analysis.py');
        const pythonProcess = spawn('python', [scriptPath, imagePath]);
        
        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${errorString}`));
                return;
            }
            try {
                const jsonResult = JSON.parse(dataString);
                resolve(jsonResult);
            } catch (e) {
                reject(new Error(`Failed to parse Python output: ${dataString}`));
            }
        });
    });
};

/**
 * @route   POST /api/ai/analyze-skin
 * @desc    Analyze skin using Gemini Vision API (Legacy/Alternative)
 */
exports.analyzeSkin = async (req, res) => {
    // ... (Keep existing Gemini implementation if needed, or redirect to analyzeFace)
    // For now, let's redirect logic to analyzeFace if python is preferred, 
    // but I'll leave this here as per original file to avoid breaking changes if frontend uses it.
    // ... (Existing code implementation)
    return exports.analyzeFace(req, res); // Reuse the new implementation
};

/**
 * @route   POST /api/ai/analyze-face
 * @desc    Analyze face using Python AI Module
 * @access  Public (Save history if logged in)
 */
exports.analyzeFace = async (req, res) => {
    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({ success: false, message: 'Image data is required' });
        }

        // 1. Save Base64 to Temp File
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const tempDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const fileName = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = path.join(tempDir, fileName);
        
        fs.writeFileSync(filePath, base64Data, 'base64');

        // 2. Call Python Script
        let analysisResult;
        try {
            analysisResult = await runPythonAnalysis(filePath);
        } catch (err) {
            console.error('Python Analysis Error:', err);
            // Fallback to Gemini if Python fails? Or just return error.
            // Let's return error for now as requested stack is Python.
            // Cleanup
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(500).json({ success: false, message: 'AI Analysis failed', error: err.message });
        }

        // 3. Cleanup Temp File
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        // 4. Save to History (if user logged in)
        if (req.user) {
            await AiAnalysis.create({
                user: req.user.id,
                imageUrl: "base64_image_placeholder", // Don't save full base64 to DB to save space, or upload to S3/Cloudinary
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

        // 2. Fetch Potential Products from DB
        // Fetch a broad range of products to let Gemini choose the best ones
        // In production, we might want to pre-filter using Vector Search or Text Search to reduce token usage
        // For now, we fetch relevant categories: Toner, Serum, Cream, Sunscreen, Cushion
        const products = await Product.find({
            Category: { $in: ['Toner', 'Serum', 'Cream', 'Sunscreen', 'Cushion', 'Cleanser'] },
            Stock_Quantity: { $gt: 0 } // Only recommend in-stock items
        }).select('Product_ID Name Category Description_Short Skin_Type_Target Main_Concern Price Thumbnail_Images slug');

        if (!products || products.length === 0) {
             return res.status(404).json({ success: false, message: 'No products available for recommendation' });
        }

        // 3. Prepare Prompt for Gemini
        // We act as a Beauty Consultant
        const productListStr = products.map(p => 
            `- ID: ${p._id}, Name: ${p.Name}, Category: ${p.Category}, For: ${p.Skin_Type_Target}, Treats: ${p.Main_Concern}`
        ).join('\n');

        const prompt = `
        You are a professional Dermatologist and Beauty Consultant for Tirtir (a Korean beauty brand).
        
        **User Profile:**
        - Skin Type: ${skinType}
        - Skin Tone: ${skinTone}
        - Undertone: ${undertone || 'Unknown'}
        - Primary Concerns: ${concerns ? concerns.join(', ') : 'None'}
        
        **Task:**
        Create a personalized "Glass Skin" Skincare Routine for this user using ONLY the available products below.
        
        **Available Products:**
        ${productListStr}
        
        **Requirements:**
        1. Select exactly 3-5 key products for a morning/night routine (Cleanser -> Toner -> Serum -> Cream -> Sunscreen/Cushion).
        2. Explain WHY each product was chosen based on their specific skin analysis (e.g., "This serum helps with your redness...").
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

        res.json({
            success: true,
            data: {
                routine: enrichedRoutine.filter(r => r.product), // Filter out invalid IDs
                advice: recommendationData.expert_advice
            }
        });

    } catch (error) {
        console.error('Recommend Routine Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/ai/history
 * @desc    Get user's analysis history
 * @access  Private
 */
exports.getHistory = async (req, res) => {
    try {
        const history = await AiAnalysis.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10);
            
        res.json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.healthCheck = (req, res) => {
    res.json({ status: 'OK', python: true, gemini: !!visionModel });
};
