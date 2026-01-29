const Shade = require("../models/shade.model");
const { rgbToLab, deltaE00 } = require("../utils/colorUtils");

exports.findBestMatch = async (req, res) => {
    try {
        const { r, g, b, l, a, b: bVal, skinType } = req.body;
        let userLab = { L: l, a: a, b: bVal };

        // If RGB provided but no LAB, convert it
        if ((l === undefined || a === undefined || bVal === undefined) && (r !== undefined && g !== undefined && b !== undefined)) {
            userLab = rgbToLab(r, g, b);
        }

        if (userLab.L === undefined) {
            return res.status(400).json({ message: "Missing color data (RGB or LAB required)" });
        }

        const shades = await Shade.find({});
        
        // 1. Determine User Undertone (Heuristic)
        // Skin usually has b > a (Yellow > Red). 
        // High b/a ratio (> 1.5) -> Warm. Low (< 1.2) -> Cool. Middle -> Neutral.
        let userUndertone = 'Neutral';
        if (userLab.a !== 0) {
            const ratio = userLab.b / userLab.a;
            if (ratio > 1.5) userUndertone = 'Warm';
            else if (ratio < 1.2) userUndertone = 'Cool';
        }

        // 2. Oxidation Simulation (Target Shift)
        // If Oily, we want a shade that STARTS lighter (higher L).
        // Target_L = User_L + Shift.
        let targetL = userLab.L;
        let adjustmentNote = "Màu tệp với da tự nhiên.";

        if (skinType === 'Oily') {
             // Shift target L up by 2.5 (User requested formula)
             // We look for a shade that is brighter than the user.
             targetL += 2.5; 
             adjustmentNote = "Đã chọn màu sáng hơn 1 tone vì bạn da dầu (tránh xuống tông).";
        }

        // Modified User Target for Matching
        const targetLab = { ...userLab, L: targetL };

        const results = shades.map(shade => {
            // Ensure shade has LAB values
            let shadeLab = { L: shade.L, a: shade.a, b: shade.b };
            
            // Fallback: if shade has no LAB but has RGB, convert
            if ((shade.L === undefined) && (shade.R !== undefined)) {
                shadeLab = rgbToLab(shade.R, shade.G, shade.B);
            }

            // Skip if no color data
            if (shadeLab.L === undefined) return null;

            // --- WEIGHTED SCORING SYSTEM ---
            
            // 1. DeltaE (Base Score) - Distance between Target and Shade
            const dE = deltaE00(targetLab, shadeLab);

            // 2. Undertone Penalty
            // If shade has 'Undertone' field, use it. Otherwise guess from name (C=Cool, N=Neutral, W=Warm)
            let shadeUndertone = shade.Undertone;
            if (!shadeUndertone) {
                if (shade.Shade_Code.endsWith('C')) shadeUndertone = 'Cool';
                else if (shade.Shade_Code.endsWith('W')) shadeUndertone = 'Warm';
                else shadeUndertone = 'Neutral';
            }
            
            // Penalty: 5 points if mismatch (e.g. Cool vs Warm)
            // Allow Neutral to match others with less penalty? 
            // User Rule: "UserUndertone != ProductUndertone -> +5"
            let pUndertone = 0;
            // Normalize strings
            const uU = userUndertone.toLowerCase();
            const sU = (shadeUndertone || '').toLowerCase();
            
            if (uU !== 'neutral' && sU !== 'neutral' && uU !== sU) {
                pUndertone = 5;
            } else if ((uU === 'neutral' && sU !== 'neutral') || (uU !== 'neutral' && sU === 'neutral')) {
                 // Slight penalty for Neutral <-> Warm/Cool mix
                 pUndertone = 2; 
            }

            // 3. Brightness Penalty
            // If Shade is darker than User (L_shade < L_user), penalize.
            // We compare against original User L, not Target L (which might be shifted).
            // Actually, if we shifted Target L up, we definitely don't want something darker than original user.
            let pBrightness = 0;
            if (shadeLab.L < userLab.L) {
                // Penalize 2 points per unit of darkness
                pBrightness = (userLab.L - shadeLab.L) * 2;
            }

            // Total Score
            const totalScore = dE + pUndertone + pBrightness;
            
            return { 
                ...shade.toObject(), 
                matchScore: totalScore,
                deltaE: dE,
                predictedUndertone: shadeUndertone,
                adjustmentNote: adjustmentNote
            };
        }).filter(item => item !== null);

        // Sort by lowest Total Score (best match)
        results.sort((x, y) => x.matchScore - y.matchScore);

        // Get Top 5
        const topMatches = results.slice(0, 5);

        // Enhance with Product Image
        const finalResults = await Promise.all(topMatches.map(async (match) => {
            let imageUrl = match.Shade_Image;
            let productName = ""; // Default empty

            // If no specific shade image, or to get Product Name, fetch Product
            // Optimization: We could fetch all products at once, but for 5 items, parallel requests are fine.
            // We specifically want the Product Thumbnail if Shade Image is missing.
            
            const product = await Product.findOne({ Product_ID: match.Product_ID }).select('Thumbnail_Images Name');
            
            if (product) {
                if (!imageUrl) {
                    imageUrl = product.Thumbnail_Images;
                }
                productName = product.Name;
            }

            return {
                ...match,
                Image_URL: imageUrl,
                Product_Name: productName
                // Ensure we send back a valid image path
                // If still no image, frontend will handle placeholder
            };
        }));

        res.json(finalResults);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getShades = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit || 50), 200);

        const filter = {};
        if (req.query.productId) filter.Product_ID = req.query.productId;
        if (req.query.parentId) filter.Parent_ID = req.query.parentId;
        if (req.query.shadeType) filter.Shade_Type = req.query.shadeType;

        const data = await Shade.find(filter).limit(limit).sort({ No: 1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getShadeById = async (req, res) => {
    try {
        const item = await Shade.findOne({ Shade_ID: req.params.shadeId });
        if (!item) return res.status(404).json({ message: "Shade not found" });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
