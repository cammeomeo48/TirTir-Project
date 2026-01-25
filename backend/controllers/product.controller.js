const Product = require("../models/product.model");
const Shade = require("../models/shade.model");

// Helper to generate slug from name
const generateSlug = (name) => {
    if (!name) return '';
    return name.toLowerCase()
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
        category: product.Category_Slug || product.Category, // Generic category field
        // Add any other fields if FE requests them later. 
    };
};

exports.getAllProducts = async (req, res) => {
    try {
        const {
            keyword,
            category,
            categorySlug,
            isSkincare,
            skinType,
            concern,
            sort,
            page = 1,
            limit = 12,
        } = req.query;

        // 1) Build query
        const queryObj = {};

        if (keyword) {
            queryObj.Name = { $regex: keyword, $options: "i" };
        }

        // Prefer slug if provided (Exact), otherwise Category (Regex)
        if (categorySlug) {
            queryObj.Category_Slug = categorySlug;
        } else if (category) {
            queryObj.Category = { $regex: category, $options: "i" };
        }

        if (isSkincare !== undefined) {
            queryObj.Is_Skincare = isSkincare === "true";
        }

        if (skinType) {
            queryObj.Skin_Type_Target = { $regex: skinType, $options: "i" };
        }

        if (concern) {
            queryObj.Main_Concern = { $regex: concern, $options: "i" };
        }

        // 2) Sort
        let sortObj = { _id: -1 };
        if (sort) {
            switch (sort) {
                case "price_asc":
                    sortObj = { Price: 1 };
                    break;
                case "price_desc":
                    sortObj = { Price: -1 };
                    break;
                case "best_seller":
                    sortObj = { Is_Best_Seller: -1 };
                    break;
                case "newest":
                    sortObj = { _id: -1 };
                    break;
                default:
                    sortObj = { _id: -1 };
                    break;
            }
        }

        // 3) Pagination
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        // 4) Execute
        const [total, products] = await Promise.all([
            Product.countDocuments(queryObj),
            Product.find(queryObj).sort(sortObj).skip(skip).limit(limitNum),
        ]);

        // 5) MAP DATA for Frontend
        const mappedProducts = products.map(p => mapProductToFrontend(p));

        res.json({
            total,
            page: pageNum,
            limit: limitNum,
            data: mappedProducts,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductDetail = async (req, res) => {
    try {
        const param = req.params.id;

        // Try to find by Product_ID first
        let product = await Product.findOne({ Product_ID: param });

        // If not found, try to find by Name (derived from slug)
        // Assume slug is kebab-case of Name
        if (!product) {
            // Convert slug back to approximate regex for Name
            // e.g. "mask-fit-red-cushion" -> "Mask Fit Red Cushion" (case insensitive regex)
            const nameRegex = param.split('-').join('.*');
            product = await Product.findOne({ Name: { $regex: new RegExp(`^${nameRegex}$`, 'i') } });
        }

        if (!product) return res.status(404).json({ message: "Product not found" });

        const shades = await Shade.find({ Product_ID: product.Product_ID })
            .sort({ No: 1 });

        // Map main product data
        const mappedProduct = mapProductToFrontend(product);

        // Return mapped product + shades (shades are an additional detail requested by getProductDetail)
        res.json({
            ...mappedProduct,
            shades,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
