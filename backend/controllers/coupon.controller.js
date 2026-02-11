const Coupon = require('../models/coupon.model');

// @desc    Create new coupon (Admin only)
// @route   POST /api/v1/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            validFrom,
            validTo,
            usageLimit,
            applicableProducts,
            active
        } = req.body;

        // Validate required fields
        if (!code || !discountType || !discountValue || !validTo) {
            return res.status(400).json({
                message: 'Please provide code, discountType, discountValue, and validTo'
            });
        }

        // Validate date logic
        const fromDate = validFrom ? new Date(validFrom) : new Date();
        const toDate = new Date(validTo);

        if (fromDate >= toDate) {
            return res.status(400).json({
                message: 'validFrom must be before validTo'
            });
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({
                message: 'Coupon code already exists'
            });
        }

        // Create coupon
        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderValue: minOrderValue || 0,
            maxDiscount,
            validFrom: fromDate,
            validTo: toDate,
            usageLimit: usageLimit || 100,
            applicableProducts: applicableProducts || [],
            active: active !== undefined ? active : true
        });

        res.status(201).json({
            success: true,
            data: coupon
        });
    } catch (err) {
        console.error('Create Coupon Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all coupons (Admin only)
// @route   GET /api/v1/coupons
// @access  Private/Admin
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: coupons.length,
            data: coupons
        });
    } catch (err) {
        console.error('Get All Coupons Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get active coupons (Public)
// @route   GET /api/v1/coupons/active
// @access  Public
exports.getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();

        const coupons = await Coupon.find({
            active: true,
            validFrom: { $lte: now },
            validTo: { $gte: now },
            $expr: { $lt: ['$usedCount', '$usageLimit'] }
        })
            .select('code discountType discountValue minOrderValue validTo')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: coupons.length,
            data: coupons
        });
    } catch (err) {
        console.error('Get Active Coupons Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Validate coupon code (CRITICAL LOGIC)
// @route   POST /api/v1/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        // Validate input
        if (!code || cartTotal === undefined) {
            return res.status(400).json({
                message: 'Please provide coupon code and cart total'
            });
        }

        if (cartTotal < 0) {
            return res.status(400).json({
                message: 'Cart total cannot be negative'
            });
        }

        // Find coupon by code
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({
                valid: false,
                message: 'Invalid coupon code'
            });
        }

        // Check if coupon is active
        if (!coupon.active) {
            return res.status(400).json({
                valid: false,
                message: 'Coupon is no longer active'
            });
        }

        // Check expiry
        const now = new Date();
        if (now > coupon.validTo) {
            return res.status(400).json({
                valid: false,
                message: 'Coupon has expired'
            });
        }

        if (now < coupon.validFrom) {
            return res.status(400).json({
                valid: false,
                message: 'Coupon is not yet valid'
            });
        }

        // Check usage limit
        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                valid: false,
                message: 'Coupon usage limit has been reached'
            });
        }

        // Check minimum order value
        if (cartTotal < coupon.minOrderValue) {
            return res.status(400).json({
                valid: false,
                message: `Minimum order value of $${coupon.minOrderValue} required`
            });
        }

        // Calculate discount amount
        let discountAmount = 0;

        if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue;
        } else if (coupon.discountType === 'percentage') {
            discountAmount = (cartTotal * coupon.discountValue) / 100;

            // Apply max discount cap for percentage type
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        }

        // Ensure discount doesn't exceed cart total
        if (discountAmount > cartTotal) {
            discountAmount = cartTotal;
        }

        // Calculate new total
        const newTotal = Math.max(0, cartTotal - discountAmount);

        // Return validation result
        res.json({
            valid: true,
            code: coupon.code,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            newTotal: parseFloat(newTotal.toFixed(2)),
            discountType: coupon.discountType,
            message: 'Coupon applied successfully'
        });
    } catch (err) {
        console.error('Validate Coupon Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Apply coupon (increment usage count)
// @route   POST /api/v1/coupons/apply
// @access  Private
exports.applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                message: 'Please provide coupon code'
            });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({
                message: 'Coupon not found'
            });
        }

        // Increment usage count
        coupon.usedCount += 1;
        await coupon.save();

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            usedCount: coupon.usedCount
        });
    } catch (err) {
        console.error('Apply Coupon Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update coupon (Admin only)
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        let coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                message: 'Coupon not found'
            });
        }

        // Validate date logic if dates are being updated
        if (req.body.validFrom || req.body.validTo) {
            const fromDate = req.body.validFrom ? new Date(req.body.validFrom) : coupon.validFrom;
            const toDate = req.body.validTo ? new Date(req.body.validTo) : coupon.validTo;

            if (fromDate >= toDate) {
                return res.status(400).json({
                    message: 'validFrom must be before validTo'
                });
            }
        }

        coupon = await Coupon.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        res.json({
            success: true,
            data: coupon
        });
    } catch (err) {
        console.error('Update Coupon Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete coupon (Admin only)
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                message: 'Coupon not found'
            });
        }

        await coupon.deleteOne();

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (err) {
        console.error('Delete Coupon Error:', err);
        res.status(500).json({ message: err.message });
    }
};
