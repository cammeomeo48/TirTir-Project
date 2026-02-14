const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Shade = require("../models/shade.model");
const StockHistory = require("../models/stock.history.model");

// Helper to generate slug from name
const generateSlug = (name) => {
    if (!name) return '';
    return name.toLowerCase()
        .replace('tirtir', '') // Remove brand name for cleaner slug
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '');    // Trim hyphens
};

// STRICT DATA MAPPING LAYER
// Prevents DB schema changes from breaking Frontend
const mapProductToFrontend = (product) => {
    return {
        id: product.Product_ID, // Map Product_ID to 'id' for easier FE consumption if needed, or keep strictly Product_ID
        Product_ID: product.Product_ID, // Keep original for compatibility
        Name: product.Name,
        Price: product.Price,
        Thumbnail_Images: product.Thumbnail_Images,
        Category: product.Category,
        Is_Skincare: product.Is_Skincare || false,
        slug: generateSlug(product.Name), // Dynamic Slug Generation
        description: product.Description_Short, // Added description for Detail page
        images: [product.Thumbnail_Images, ...(product.Gallery_Images || [])], // Map images array for Detail page
        descriptionImages: product.Description_Images || [], // Added description images
        category: product.Category_Slug || product.Category, // Generic category field
        Stock_Quantity: product.Stock_Quantity, // Added Stock Quantity
        Stock_Reserved: product.Stock_Reserved || 0, // Added Reserved Stock
        Rating_Average: product.Rating_Average || 0, // Added Rating Average
        // Add any other fields if FE requests them later. 
    };
};

// Self-healing: Populates 'slug' field if missing
exports.ensureSlugs = async () => {
    try {
        console.log("Checking for products with missing slugs...");
        const products = await Product.find({ slug: { $exists: false } });
        if (products.length === 0) {
            console.log("All products have slugs.");
            return;
        }

        console.log(`Found ${products.length} products without slugs. Generating...`);
        let count = 0;
        for (const p of products) {
            if (p.Name) {
                p.slug = generateSlug(p.Name);
                await p.save();
                count++;
            }
        }
        console.log(`Successfully generated slugs for ${count} products.`);
    } catch (err) {
        console.error("Error ensuring slugs:", err);
    }
};

// Meta-Category Mappings (Frontend Slugs -> DB Category Slugs)
const CATEGORY_MAPPINGS = {
    'skincare': ['cleanser', 'toner', 'serum', 'ampoule', 'cream', 'sunscreen', 'facial-oil', 'eye-cream', 'mask', 'gift-set', 'skincare'],
    'makeup': ['cushion', 'lip', 'makeup', 'tint', 'balm', 'primer', 'setting-spray'],
    'face': ['cushion', 'makeup', 'primer', 'setting-spray'],
    'face-makeup': ['cushion', 'makeup', 'primer', 'setting-spray'], // Matched to /collections/face-makeup
    'lip': ['lip', 'tint', 'balm'],
    'lips': ['lip', 'tint', 'balm'], // Handle plural case
    'lip-makeup': ['lip', 'tint', 'balm'], // Matched to /collections/lip-makeup
    'cleanse-toner': ['cleanser', 'toner'],
    'treatments': ['serum', 'ampoule', 'facial-oil', 'eye-cream', 'mask'],
    'moisturize-sunscreen': ['cream', 'sunscreen', 'gift-set']
};

// GET /api/products/low-stock (Admin)
exports.getLowStockProducts = async (req, res) => {
    try {
        const threshold = req.query.threshold || 10;
        const products = await Product.find({ Stock_Quantity: { $lte: threshold } })
            .select('Name Product_ID Stock_Quantity Stock_Reserved Thumbnail_Images')
            .sort({ Stock_Quantity: 1 });
        
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/:id/stock-history (Admin)
exports.getProductStockHistory = async (req, res) => {
    try {
        const history = await StockHistory.find({ product: req.params.id })
            .sort({ createdAt: -1 })
            .populate('performedBy', 'firstName lastName email');
            
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- MISSING EXPORTS STUBS (Moved to end to ensure definition) ---
// exports.getProductById = exports.getProductDetail; // MOVED TO END
exports.advancedSearch = async (req, res) => {
    // Reuse getAllProducts but ensure we pass query params correctly if needed
    // Actually simpler to just alias it, but since I'm rewriting the file, I'll alias it at the bottom to be safe.
    return exports.getAllProducts(req, res);
};

exports.getSearchSuggestions = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.json([]);
        
        const suggestions = await Product.find({ 
            Name: { $regex: keyword, $options: 'i' } 
        }).select('Name slug -_id').limit(5);
        
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProductFilters = async (req, res) => {
    // Return available static filters or aggregated data
    // For now return empty or basic structure
    res.json({
        categories: Object.keys(CATEGORY_MAPPINGS),
        concerns: ["Dryness", "Oiliness", "Acne", "Aging", "Sensitivity"],
        skinTypes: ["Oily", "Dry", "Combination", "Normal"]
    });
};

exports.getAllProducts = async (req, res) => {
    try {
        const {
            keyword,
            category, // Comma separated list of Categories (Display Names) e.g. "Cushion,Toner"
            categorySlug, // Special purpose slug logic (mostly for Collection pages)
            isSkincare,
            skinType,
            concern,
            sort,
            page = 1,
            limit = 12,
        } = req.query;

        // 1. Build BASE MATCH stage (Price, Skin, Concern, Keyword)
        // These filters apply to EVERYTHING (products AND counts).
        const baseMatch = {};

        if (keyword) {
            const words = keyword.trim().split(/\s+/).filter(w => w.length > 0);
            if (words.length > 0) {
                baseMatch.$and = words.map(word => ({
                    $or: [
                        { Name: { $regex: word, $options: "i" } },
                        { Category: { $regex: word, $options: "i" } },
                        { Category_Slug: { $regex: word, $options: "i" } },
                        { Description_Short: { $regex: keyword, $options: "i" } }, // Also search full keyword in short description
                        { Full_Description: { $regex: word, $options: "i" } },
                        { Main_Concern: { $regex: word, $options: "i" } },
                        { Skin_Type_Target: { $regex: word, $options: "i" } }
                    ]
                }));
            }
        }

        if (isSkincare !== undefined) {
            baseMatch.Is_Skincare = isSkincare === "true";
        }

        if (skinType) {
            baseMatch.Skin_Type_Target = { $regex: skinType, $options: "i" };
        }

        if (concern) {
            const concernList = concern.split(',').map(c => c.trim());
            // Create regex for each concern and use $in equivalent (or $or with regex)
            // Since we want ANY match (OR logic) like Category
            const regexList = concernList.map(c => new RegExp(c, 'i'));
            baseMatch.Main_Concern = { $in: regexList };
        }

        // 2. Build CATEGORY MATCH stage
        // This filter ONLY applies to the product list, NOT the sidebar counts.
        const categoryMatch = {};

        // Handle 'category' (Sidebar Filter - Multi-select)
        if (category) {
            const catList = category.split(',').map(c => c.trim());
            if (catList.length > 0) {
                // Map Display Names (e.g. "Lip", "Cushion") to Database Slugs AND regex for Name
                let targetSlugs = [];
                let targetNames = []; // Fallback for regex on 'Name' or 'Category'

                catList.forEach(catName => {
                    // Normalize: "Lip" -> "lip", "Facial Oil" -> "facial-oil"
                    const normalized = catName.toLowerCase().replace(/\s+/g, '-');
                    targetNames.push(new RegExp(catName, 'i')); // Regex for Name/Category field

                    // Check Umbrella Mappings
                    if (CATEGORY_MAPPINGS[normalized]) {
                        targetSlugs.push(...CATEGORY_MAPPINGS[normalized]);
                    } else {
                        // Fallback: Assume the normalized name is the slug (e.g. "cushion" -> "cushion")
                        targetSlugs.push(normalized);
                    }
                });

                // ROBUST FILTER: Check Category_Slug OR Category (Field) OR Name (Regex)
                // This fixes "Issue 1: Inverse Logic" where missing slugs caused empty results.
                categoryMatch.$or = [
                    { Category_Slug: { $in: targetSlugs } },
                    { Category: { $in: targetNames } },
                    // Fallback: If Category field is inconsistent, maybe checking Name helps?
                    // { Name: { $in: targetNames } } // Removed for now to be safe, stick to Category field.
                ];
            }
        }

        // Handle 'categorySlug' (Collection Pages - specialized)
        // This usually defines the "Scope" of the page (e.g. /collections/makeup), so it SHOULD limit counts too?
        // Let's treat it as a BASE filter for now if it's a page context.
        if (categorySlug) {
            if (CATEGORY_MAPPINGS[categorySlug]) {
                baseMatch.Category_Slug = { $in: CATEGORY_MAPPINGS[categorySlug] };
            } else {
                baseMatch.Category_Slug = categorySlug;
            }
        }

        // 3. Build SORT stage
        let sortStage = { _id: -1 };
        if (sort) {
            switch (sort) {
                case "best-selling":
                    sortStage = { Sold_Quantity: -1 };
                    break;
                case "price-asc":
                case "price_asc":
                    sortStage = { Price: 1 };
                    break;
                case "price-desc":
                case "price_desc":
                    sortStage = { Price: -1 };
                    break;
                case "newest":
                    sortStage = { _id: -1 };
                    break;
                case "top-rated":
                    sortStage = { Rating_Average: -1 };
                    break;
                case "title-asc":
                    sortStage = { Name: 1 };
                    break;
                // Legacy support
                case "best_seller":
                    sortStage = { Sold_Quantity: -1 };
                    break;
                default:
                    sortStage = { _id: -1 };
                    break;
            }
        }

        // 4. Pagination
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.max(parseInt(limit, 10) || 12, 1);
        const skip = (pageNum - 1) * limitNum;

        // 5. AGGREGATION PIPELINE
        // Strategy: 
        // - First Match: Base Filters (Skin, Price, PageContext, Concern)
        // - Facet A (Products): Apply Category Filter -> Sort -> Skip -> Limit
        // - Facet B (Total Count): Apply Category Filter -> Count
        // - Facet C (Categories): Group by Category (IGNORING Category Filter)
        // - Facet D (Concerns): Group by Main_Concern (IGNORING Concern Filter? OR applying it?)
        //   Usually "Regimens" (Concerns) should show counts available under current CATEGORY context?
        //   But our current architecture separates Category Filter from Base Filters.
        //   If we want "Regimen" counts to reflect the selected Category, we must APPLY categoryMatch to them.
        //   If we want "Regimen" counts to be global (like Category counts), we ignore categoryMatch.
        //   Let's ignore categoryMatch for now to keep them visible.
        const pipeline = [
            { $match: baseMatch },
            {
                $facet: {
                    // Pipeline A: Get Data (Applied Category Filter)
                    "products": [
                        { $match: categoryMatch }, // <--- Apply Category Filter HERE
                        { $sort: sortStage },
                        { $skip: skip },
                        { $limit: limitNum }
                    ],
                    // Pipeline B: Get Total Count (For Pagination - MUST apply Category Filter)
                    "totalCount": [
                        { $match: categoryMatch }, // <--- Apply Category Filter HERE
                        { $count: "count" }
                    ],
                    // Pipeline C: Global Category Counts (Available options in current Scope)
                    "categories": [
                        { $group: { _id: "$Category_Slug", count: { $sum: 1 } } }, // Changed from Category to Category_Slug for better grouping
                        { $sort: { _id: 1 } }
                    ],
                    // Pipeline D: Global Concern Counts
                    "concerns": [
                        { $group: { _id: "$Main_Concern", count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    // Pipeline E: Global SkinType Counts
                    "skinTypes": [
                        { $group: { _id: "$Skin_Type_Target", count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ];

        const results = await Product.aggregate(pipeline);
        const result = results[0];

        const products = result.products;
        const total = result.totalCount[0] ? result.totalCount[0].count : 0;
        const categories = result.categories.map(c => ({ name: c._id, count: c.count }));
        const concerns = result.concerns.map(c => ({ name: c._id, count: c.count }));
        const skinTypes = result.skinTypes.map(c => ({ name: c._id, count: c.count }));

        // 6. Map Data for Frontend
        const mappedProducts = products.map(p => mapProductToFrontend(p));

        res.json({
            total,
            page: pageNum,
            limit: limitNum,
            data: mappedProducts,
            categories: categories, // Return category counts for sidebar
            concerns: concerns,
            skinTypes: skinTypes
        });

    } catch (err) {
        console.error("Aggregation Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.getProductDetail = async (req, res) => {
    try {
        const param = req.params.id;

        // FAST LOOKUP: Check Exact Slug or Product_ID (Indexed)
        let product = await Product.findOne({
            $or: [
                { slug: param },
                { Product_ID: param }
            ]
        });

        // SLOW FALLBACK: Regex Name Match (Only if slug not found)
        // This should rarely run once slugs are populated
        if (!product) {
            const nameRegex = param.split('-').join('.*');
            // Removed ^ anchor to allow partial match (e.g. "Mask Fit" matching "Tirtir Mask Fit")
            product = await Product.findOne({ Name: { $regex: new RegExp(`${nameRegex}`, 'i') } });
        }

        if (!product) return res.status(404).json({ message: "Product not found" });

        // 3. Fetch Shades from SEPARATE Collection (as per user requirement)
        const shades = await Shade.find({ Product_ID: product.Product_ID })
            .sort({ No: 1 });

        // 4. Map Data & Merge Images
        const mappedProduct = mapProductToFrontend(product);

        // MERGE LOGIC: Combine Product Gallery Images + Shade Images
        // Start with Thumbnail
        let allImages = [mappedProduct.Thumbnail_Images];

        // Add Gallery Images
        if (mappedProduct.images && mappedProduct.images.length > 0) {
            // mappedProduct.images already includes Thumbnail + Gallery from helper, 
            // but let's be explicit to avoid duplicates if helper changes.
            // Actually currently helper returns [Thumb, ...Gallery].
            allImages = [...mappedProduct.images];
        }

        // Add Shade Images (if not already present)
        if (shades && shades.length > 0) {
            shades.forEach(s => {
                if (s.Shade_Image && !allImages.includes(s.Shade_Image)) {
                    allImages.push(s.Shade_Image);
                }
            });
        }

        // Return merged data
        res.json({
            ...mappedProduct,
            images: allImages, // Overwrite with fully merged list
            shades: shades.map(s => ({
                name: s.Shade_Name,
                color: s.Hex_Code,
                image: s.Shade_Image,
                // Include other shade details if needed by frontend
            }))
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// NEW: Get Low Stock Products (Admin Alert)
exports.getLowStockProducts = async (req, res) => {
    try {
        const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;

        const products = await Product.find({
            Stock_Quantity: { $lt: threshold }
        }).select('Product_ID Name Stock_Quantity Thumbnail_Images Category');

        res.json({
            count: products.length,
            threshold: threshold,
            products: products
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// NEW: Get Stock History (Log)
exports.getStockHistory = async (req, res) => {
    try {
        const { id } = req.params; // Product ID (String or ObjectId)

        // Find product first to get ObjectId if custom ID is used
        let productQuery = { Product_ID: id };
        if (mongoose.Types.ObjectId.isValid(id)) {
            productQuery = { _id: id };
        }

        const product = await Product.findOne(productQuery);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const history = await StockHistory.find({ product: product._id })
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { Product_ID, Name, Price, Category } = req.body;
        if (!Product_ID || !Name || Price === undefined || !Category) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const existingProduct = await Product.findOne({ Product_ID });
        if (existingProduct) {
            return res.status(400).json({ message: "Product already exists" });
        }
        const slug = generateSlug(Name);
        const product = new Product({ ...req.body, slug });
        const created = await product.save();
        res.status(201).json(mapProductToFrontend(created));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const or = [{ Product_ID: id }];
        if (mongoose.Types.ObjectId.isValid(id)) or.push({ _id: id });
        const product = await Product.findOne({ $or: or });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        Object.assign(product, req.body);
        if (req.body.Name) {
            product.slug = generateSlug(req.body.Name);
        }
        const updated = await product.save();
        res.json(mapProductToFrontend(updated));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const or = [{ Product_ID: id }];
        if (mongoose.Types.ObjectId.isValid(id)) or.push({ _id: id });
        const deleted = await Product.findOneAndDelete({ $or: or });
        if (!deleted) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({ message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.bulkImport = async (req, res) => {
    // Stub
    res.status(501).json({ message: "Not implemented yet" });
};

exports.updateStock = async (req, res) => {
    // Stub
    res.status(501).json({ message: "Not implemented yet" });
};

// --- ALIASES (Must be at the end) ---
exports.getProductById = exports.getProductDetail;
