const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * ===== AI BEAUTY ADVISOR CONTROLLER =====
 * Uses Gemini AI Vision to analyze skin and provide personalized recommendations
 */

// Initialize Gemini AI
let genAI = null;
let visionModel = null;

const initializeGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if API key is missing or is a placeholder
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.includes('your_')) {
        console.error('⚠️ GEMINI_API_KEY is not configured properly!');
        console.error('   Please get your API key from: https://ai.google.dev/');
        console.error('   Then update the GEMINI_API_KEY in your .env file');
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

// Initialize on module load
initializeGemini();

/**
 * @route   POST /api/ai/analyze-skin
 * @desc    Analyze skin using Gemini Vision API
 * @access  Public (but rate-limited recommended)
 * @body    { imageData: string (base64), skinType: string }
 */
exports.analyzeSkin = async (req, res) => {
    try {
        const { imageData, skinType } = req.body;

        // Validation
        if (!imageData) {
            return res.status(400).json({
                success: false,
                message: 'Image data is required'
            });
        }

        // Check if Gemini is initialized
        if (!visionModel) {
            const initialized = initializeGemini();
            if (!initialized) {
                return res.status(503).json({
                    success: false,
                    message: 'AI service is temporarily unavailable. Please contact administrator.'
                });
            }
        }

        // Prepare the prompt for Gemini
        const prompt = `You are an expert beauty consultant specializing in foundation matching for Asian skin tones, specifically for TirTir cushion foundations.

Analyze this facial image and provide a detailed skin analysis in Vietnamese language:

1. **Undertone Analysis**: Determine if the skin has Cool (hồng), Warm (vàng), or Neutral undertones. Look at the cheeks, forehead, and overall complexion.

2. **Skin Characteristics**:
   - Brightness level (sáng/trung bình/tối)
   - Evenness of skin tone (độ đều màu)
   - Visible concerns (redness, dark spots, uneven areas)

3. **Foundation Recommendation Logic**:
   - For ${skinType || 'Normal'} skin type, what shade characteristics would work best?
   - Consider coverage needs based on visible skin concerns
   - Think about how foundation will oxidize throughout the day

4. **Personalized Explanation**: Write a friendly, conversational explanation (2-3 sentences) in Vietnamese about WHY you recommend certain tones. Be specific about what you observe in their skin.

Format your response as JSON:
{
  "undertone": "Cool" | "Warm" | "Neutral",
  "confidence": 0.0-1.0,
  "brightness": "Light" | "Medium" | "Deep",
  "skinConcerns": ["concern1", "concern2"],
  "recommendedToneShift": "lighter" | "exact" | "deeper",
  "explanation": "Your personalized explanation in Vietnamese here",
  "reasoning": "Technical reasoning behind the recommendation"
}`;

        // Convert base64 to buffer for Gemini
        const imageBase64 = imageData.replace(/^data:image\/\w+;base64,/, '');

        const imageParts = [
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: 'image/jpeg'
                }
            }
        ];

        // Call Gemini Vision API
        console.log('📸 Sending image to Gemini AI for analysis...');
        const result = await visionModel.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        console.log('🤖 Gemini raw response:', text);

        // Parse the JSON response
        let analysis;
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
            analysis = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response as JSON:', parseError);
            // Fallback response
            analysis = {
                undertone: 'Neutral',
                confidence: 0.7,
                brightness: 'Medium',
                skinConcerns: [],
                recommendedToneShift: 'exact',
                explanation: text.substring(0, 200),
                reasoning: 'AI analysis completed but response format was unexpected'
            };
        }

        return res.status(200).json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('❌ AI Analysis Error:', error);

        // Graceful degradation
        return res.status(500).json({
            success: false,
            message: 'AI analysis failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @route   GET /api/ai/health
 * @desc    Check if Gemini AI is properly configured
 * @access  Public
 */
exports.healthCheck = async (req, res) => {
    const isConfigured = !!process.env.GEMINI_API_KEY;
    const isInitialized = !!visionModel;

    return res.status(200).json({
        success: true,
        configured: isConfigured,
        initialized: isInitialized,
        model: isInitialized ? 'gemini-2.0-flash-exp' : null
    });
};
