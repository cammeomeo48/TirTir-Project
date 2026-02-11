const Review = require('../models/review.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { ORDER_STATUS } = require('../constants');
const mongoose = require('mongoose');

// Helper to resolve Product ObjectId from param (ID, Slug, or Product_ID)
const resolveProductId = async (idParam) => {
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        return idParam;
    }
    const product = await Product.findOne({
        $or: [{ slug: idParam }, { Product_ID: idParam }]
    });
    return product ? product._id : null;
};

// @desc    Get reviews for a product
// @route   GET /api/v1/products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const rawId = req.params.id;
        const productId = await resolveProductId(rawId);
        
        if (!productId) {
             return res.status(404).json({ message: "Product not found" });
        }
        
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const total = await Review.countDocuments({ product: productId });

        const reviews = await Review.find({ product: productId })
            .populate('user', 'name avatar') // Assuming user has name and avatar
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: reviews.length,
            total,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit)
            },
            data: reviews
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a review
// @route   POST /api/v1/products/:id/reviews
// @access  Private (Requires Verified Purchase)
exports.createReview = async (req, res) => {
    try {
        const rawId = req.params.id;
        const productId = await resolveProductId(rawId);
        const userId = req.user.id;
        const { rating, title, comment, images } = req.body;

        if (!productId) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        // We already resolved ID, but verify existence explicitly if needed (resolveProductId checks existence too)
        // const product = await Product.findById(productId); 
        
        // 1. Check if user already reviewed
        const alreadyReviewed = await Review.findOne({ product: productId, user: userId });
        if (alreadyReviewed) {
            return res.status(400).json({ message: "You have already reviewed this product" });
        }

        // 2. Check for Verified Purchase
        // User must have an order with this product that is 'Delivered' (or 'Shipped' depending on policy)
        // We look for orders by this user, containing this product item
        const hasPurchased = await Order.findOne({
            user: userId,
            'items.product': productId,
            status: { $in: ['Delivered', 'Shipped', 'Completed'] } // Allow Shipped too in case status update lags
        });

        if (!hasPurchased) {
            return res.status(403).json({ 
                message: "You can only review products you have purchased and received." 
            });
        }

        const review = await Review.create({
            user: userId,
            product: productId,
            rating,
            title,
            comment,
            images,
            verifiedPurchase: true
        });

        res.status(201).json({
            success: true,
            data: review
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private (Owner only)
exports.updateReview = async (req, res) => {
    try {
        let review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Check ownership
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: "Not authorized to update this review" });
        }

        review = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        
        // Recalculate average manually or ensure hook runs (findByIdAndUpdate doesn't trigger save middleware)
        // We added a post findOneAndDelete hook, but for Update we might need to manually trigger static
        await Review.getAverageRating(review.product);

        res.status(200).json({
            success: true,
            data: review
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private (Owner or Admin)
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Check ownership
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: "Not authorized to delete this review" });
        }

        await Review.findByIdAndDelete(req.params.id); // Triggers post hook we defined

        res.status(200).json({
            success: true,
            message: "Review removed"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark review as helpful
// @route   POST /api/v1/reviews/:id/helpful
// @access  Private
exports.markHelpful = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        const userId = req.user.id;

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (review.helpful.includes(userId)) {
            // Unmark
            review.helpful = review.helpful.filter(id => id.toString() !== userId);
        } else {
            // Mark
            review.helpful.push(userId);
        }

        await review.save();

        res.status(200).json({
            success: true,
            data: review.helpful
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's reviews
// @route   GET /api/v1/users/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id })
            .populate('product', 'Name Thumbnail_Images')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
