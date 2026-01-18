const Product = require("../models/product.model");
const Shade = require("../models/shade.model");

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

        res.json({
            total,
            page: pageNum,
            limit: limitNum,
            data: products,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductDetail = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findOne({ Product_ID: productId });
        if (!product) return res.status(404).json({ message: "Product not found" });

        const shades = await Shade.find({ Product_ID: productId })
            .sort({ No: 1 });

        res.json({
            ...product.toObject(),
            shades,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
