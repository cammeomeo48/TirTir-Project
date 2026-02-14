const Order = require('../models/order.model');
const Product = require('../models/product.model');
const DailyStats = require('../models/daily.stats.model');
const ChatLog = require('../models/chat.log.model');
const mongoose = require('mongoose');

const User = require('../models/user.model');

// GET /api/admin/stats/inventory
exports.getInventoryForecast = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: "$Stock_Quantity" },
                    totalValue: { $sum: { $multiply: ["$Stock_Quantity", "$Price"] } },
                    lowStockCount: {
                        $sum: { $cond: [{ $lte: ["$Stock_Quantity", 10] }, 1, 0] }
                    }
                }
            }
        ]);
        
        // Mock Forecast: Predict which items will run out in 7 days based on sales velocity
        // For now, return low stock items as "high risk"
        const atRisk = await Product.find({ Stock_Quantity: { $lte: 5 } })
            .select('Name Stock_Quantity')
            .limit(5);

        res.json({
            summary: stats[0] || { totalItems: 0, totalValue: 0, lowStockCount: 0 },
            forecast: atRisk
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/stats/ai-insights
exports.getAiInsights = async (req, res) => {
    try {
        // Aggregate from ChatLog (Top keywords)
        const topKeywords = await ChatLog.aggregate([
            { $unwind: "$keywords" }, // Assuming keywords is an array in ChatLog
            { $group: { _id: "$keywords", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            topKeywords: topKeywords.length > 0 ? topKeywords : [
                { _id: "acne", count: 150 },
                { _id: "moisturizer", count: 120 },
                { _id: "vitamin c", count: 90 },
                { _id: "sensitive skin", count: 85 },
                { _id: "anti-aging", count: 70 }
            ]
        });
    } catch (error) {
        // Return Mock Data if ChatLog aggregation fails or empty
        res.json({
            topKeywords: [
                { _id: "acne", count: 150 },
                { _id: "moisturizer", count: 120 },
                { _id: "vitamin c", count: 90 },
                { _id: "sensitive skin", count: 85 },
                { _id: "anti-aging", count: 70 }
            ]
        });
    }
};

// GET /api/admin/stats/customers
exports.getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await User.countDocuments({ role: 'user' });
        
        // New Customers (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newCustomers = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        res.json({
            total: totalCustomers,
            newLast30Days: newCustomers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/stats/sales-by-category
exports.getSalesByCategory = async (req, res) => {
    try {
        const sales = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: "$productInfo.Category",
                    totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
                    count: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/stats/revenue?range=7days
exports.getRevenueChart = async (req, res) => {
    try {
        const { range } = req.query;
        let startDate = new Date();
        
        if (range === '30days') {
            startDate.setDate(startDate.getDate() - 30);
        } else {
            startDate.setDate(startDate.getDate() - 7); // Default 7 days
        }

        const revenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$totalPrice" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(revenue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/stats/conversion
exports.getConversionFunnel = async (req, res) => {
    try {
        // Aggregate all time (or add date filter if needed)
        const stats = await DailyStats.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalAddToCart: { $sum: "$addToCart" },
                    // Orders in DailyStats might not be synced yet if we didn't update order controller
                    // So we can use DailyStats.orders if we sync it, or count from Orders.
                    // For now, let's assume DailyStats.orders is updated via a hook or controller.
                    // BUT, since we haven't updated Order Controller to push to DailyStats, 
                    // let's count Orders directly for accuracy.
                }
            }
        ]);
        
        const totalOrders = await Order.countDocuments({ status: { $ne: 'Cancelled' } });
        
        const funnel = {
            views: stats[0]?.totalViews || 0,
            addToCart: stats[0]?.totalAddToCart || 0,
            orders: totalOrders
        };

        res.json(funnel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/stats/top-products
exports.getTopProducts = async (req, res) => {
    try {
        // 1. Top Selling (Based on Order Items)
        const topSelling = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    totalSold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    _id: 1,
                    name: "$productInfo.Name",
                    totalSold: 1,
                    revenue: 1,
                    image: "$productInfo.Thumbnail_Images"
                }
            }
        ]);

        // 2. Top Viewed (Based on Product.views)
        const topViewed = await Product.find()
            .sort({ views: -1 })
            .limit(10)
            .select('Name views Thumbnail_Images Price Category');

        res.json({ topSelling, topViewed });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/stats/inventory
exports.getInventoryForecast = async (req, res) => {
    try {
        // Products with stock < 20 (Low Stock)
        const lowStock = await Product.find({ Stock_Quantity: { $lt: 20 } })
            .select('Name Stock_Quantity Price Category')
            .sort({ Stock_Quantity: 1 })
            .limit(20);
            
        // Dead Stock (High Stock but Low Views/Sales - simplified to just High Stock + Oldest for now)
        // Or just return lowStock as "Forecast" for restocking.
        
        res.json({ 
            lowStock, 
            message: "Products with less than 20 items in stock" 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/stats/ai-insights
exports.getAiInsights = async (req, res) => {
    try {
        const topKeywords = await ChatLog.aggregate([
            { $unwind: "$keywords" },
            {
                $group: {
                    _id: "$keywords",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        res.json({ topKeywords });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
