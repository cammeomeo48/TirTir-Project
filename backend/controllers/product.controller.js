const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Shade = require("../models/shade.model");

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
    // DEBUG LOG
    console.log(`[DEBUG] Mapping Product: ${product.Product_ID}`);
    console.log(`[DEBUG] Description_Images from DB:`, product.Description_Images);

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

        // 1. Build MATCH stage (Filter)
        const matchStage = {};

        if (keyword) {
            matchStage.Name = { $regex: keyword, $options: "i" };
        }

        // Handle 'category' (Sidebar Filter - Multi-select)
        if (category) {
            const catList = category.split(',').map(c => c.trim());
            if (catList.length > 0) {
                // Map Display Names (e.g. "Lip", "Cushion") to Database Slugs
                let targetSlugs = [];

                catList.forEach(catName => {
                    // Normalize: "Lip" -> "lip", "Facial Oil" -> "facial-oil"
                    const normalized = catName.toLowerCase().replace(/\s+/g, '-');

                    // Check Umbrella Mappings
                    if (CATEGORY_MAPPINGS[normalized]) {
                        targetSlugs.push(...CATEGORY_MAPPINGS[normalized]);
                    } else {
                        // Fallback: Assume the normalized name is the slug (e.g. "cushion" -> "cushion")
                        targetSlugs.push(normalized);
                    }
                });

                // Filter by Category_Slug (Indexed & Consistent)
                if (targetSlugs.length > 0) {
                    matchStage.Category_Slug = { $in: targetSlugs };
                }
            }
        }

        // Handle 'categorySlug' (Collection Pages - specialized)
        if (categorySlug) {
            if (CATEGORY_MAPPINGS[categorySlug]) {
                matchStage.Category_Slug = { $in: CATEGORY_MAPPINGS[categorySlug] };
            } else {
                matchStage.Category_Slug = categorySlug;
            }
        }

        if (isSkincare !== undefined) {
            matchStage.Is_Skincare = isSkincare === "true";
        }

        if (skinType) {
            matchStage.Skin_Type_Target = { $regex: skinType, $options: "i" };
        }

        if (concern) {
            matchStage.Main_Concern = { $regex: concern, $options: "i" };
        }

        // 2. Build SORT stage
        let sortStage = { _id: -1 };
        if (sort) {
            switch (sort) {
                case "price_asc": sortStage = { Price: 1 }; break;
                case "price_desc": sortStage = { Price: -1 }; break;
                case "best_seller": sortStage = { Is_Best_Seller: -1 }; break;
                case "newest": sortStage = { _id: -1 }; break;
                default: sortStage = { _id: -1 }; break;
            }
        }

        // 3. Pagination
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.max(parseInt(limit, 10) || 12, 1);
        const skip = (pageNum - 1) * limitNum;

        // 4. AGGREGATION PIPELINE
        const pipeline = [
            { $match: matchStage },
            {
                $facet: {
                    // Pipeline A: Get Data
                    "products": [
                        { $sort: sortStage },
                        { $skip: skip },
                        { $limit: limitNum }
                    ],
                    // Pipeline B: Get Counts (for Pagination & Sidebar)
                    "totalCount": [
                        { $count: "count" }
                    ],
                    // Pipeline C: Global Category Counts (Filtered by current criteria)
                    // If you want GLOBAL counts ignoring filters, you'd need a separate aggregation or move $match into facets.
                    // Usually users want to know "How many Cushions are there with my current search?".
                    "categories": [
                        { $group: { _id: "$Category", count: { $sum: 1 } } },
                        { $sort: { _id: 1 } } // Alphabetical sort
                    ]
                }
            }
        ];

        const results = await Product.aggregate(pipeline);
        const result = results[0];

        const products = result.products;
        const total = result.totalCount[0] ? result.totalCount[0].count : 0;
        const categories = result.categories.map(c => ({ name: c._id, count: c.count }));

        // 5. Map Data for Frontend
        const mappedProducts = products.map(p => mapProductToFrontend(p));

        res.json({
            total,
            page: pageNum,
            limit: limitNum,
            data: mappedProducts,
            categories: categories // Return category counts for sidebar
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
        res.json({ message: "Product removed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        if (stock === undefined || stock < 0) {
            return res.status(400).json({ message: "Invalid stock value" });
        }
        const or = [{ Product_ID: id }];
        if (mongoose.Types.ObjectId.isValid(id)) or.push({ _id: id });
        const product = await Product.findOne({ $or: or });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        product.Stock_Quantity = stock;
        await product.save();
        res.json({ message: "Stock updated", stock: product.Stock_Quantity });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.bulkImport = async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Invalid payload" });
        }
        let created = 0;
        let updated = 0;
        const errors = [];
        for (const p of items) {
            try {
                if (!p.Product_ID || !p.Name) {
                    errors.push({ id: p.Product_ID || "UNKNOWN", error: "Missing ID or Name" });
                    continue;
                }
                p.slug = generateSlug(p.Name);
                const existing = await Product.findOne({ Product_ID: p.Product_ID });
                if (existing) {
                    Object.assign(existing, p);
                    await existing.save();
                    updated++;
                } else {
                    await Product.create(p);
                    created++;
                }
            } catch (e) {
                errors.push({ id: p.Product_ID, error: e.message });
            }
        }
        res.json({ message: "Bulk import processed", created, updated, errors });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
