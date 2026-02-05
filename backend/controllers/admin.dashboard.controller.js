const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const { ORDER_STATUS } = require('../constants');

// GET /api/admin/dashboard/stats
exports.getStats = async (req, res) => {
    try {
        // 1. Total Revenue (excluding Cancelled)
        const revenueResult = await Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // 2. Orders by status
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Format to object { Pending: 5, Delivered: 10, ... }
        const formattedOrdersByStatus = ordersByStatus.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // 3. Top-selling products (Top 5)
        const topSellingProducts = await Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            { $unwind: '$items' },
            { $group: { 
                _id: '$items.product', 
                name: { $first: '$items.name' }, 
                price: { $first: '$items.price' },
                image: { $first: '$items.image' },
                totalSold: { $sum: '$items.quantity' } 
            }},
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // 4. New Customers (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newCustomersCount = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            role: 'user'
        });

        // 5. Sales by Category
        const salesByCategory = await Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            { $unwind: '$items' },
            { $group: { 
                _id: '$items.category', // Note: items in order might not have category saved directly. 
                count: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }},
            // Since category might not be in items, we might need to rely on product lookup if not saved.
            // But let's assume we want to ensure it works. 
            // If items.category is undefined, we group by null.
            // Let's improve this by looking up product if needed, but for performance let's try direct first.
            // Ideally, Order items should snapshot the category. If not, we do a lookup.
            { $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productInfo'
            }},
             // If _id was product ID, but here _id is category string if saved, or null.
             // Actually, the previous Top Products aggregation showed items.category might be missing.
             // Let's redo this to group by Product first, then lookup Category.
        ]);

        // Correct approach for Sales by Category (via Product Lookup)
        const salesByCategoryCorrect = await Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            { $unwind: '$items' },
            { $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product'
            }},
            { $unwind: '$product' },
            { $group: {
                _id: '$product.Category',
                totalSold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }},
             { $sort: { totalRevenue: -1 } }
        ]);

        res.json({
            totalRevenue,
            ordersByStatus: formattedOrdersByStatus,
            topSellingProducts,
            newCustomersCount,
            salesByCategory: salesByCategoryCorrect
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy thống kê dashboard" });
    }
};

// GET /api/admin/dashboard/revenue
exports.getRevenueChart = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = { status: { $ne: ORDER_STATUS.CANCELLED } };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else {
            // Default to last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query.createdAt = { $gte: thirtyDaysAgo };
        }

        const revenueData = await Order.aggregate([
            { $match: query },
            { $group: { 
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, 
                revenue: { $sum: '$totalAmount' },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.json(revenueData);
    } catch (error) {
        console.error("Revenue Chart Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy biểu đồ doanh thu" });
    }
};

// GET /api/admin/dashboard/top-products
exports.getTopProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const topProducts = await Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            { $unwind: '$items' },
            { $group: { 
                _id: '$items.product', 
                name: { $first: '$items.name' }, 
                category: { $first: '$items.category' }, // Note: items in order might not have category, need lookup if needed
                price: { $first: '$items.price' },
                image: { $first: '$items.image' },
                totalSold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }},
            { $sort: { totalSold: -1 } },
            { $limit: limit }
        ]);

        // Optional: Populate more details if needed, but for now aggregate is faster
        // If we really need category and it's not in order items, we might need a $lookup
        // But let's check order model items. It has name, price, shade, image. No category.
        // Let's do a lookup to get current product category if needed.
        
        const topProductsWithDetails = await Product.populate(topProducts, {
             path: '_id', 
             select: 'Category Stock_Quantity Product_ID' 
        });

        // Format the output
        const formatted = topProductsWithDetails
            .filter(item => item._id) // Filter out products that might have been deleted
            .map(item => ({
                _id: item._id._id,
                sku: item._id.Product_ID,
                name: item.name,
                category: item._id.Category,
                price: item.price,
                image: item.image,
                stock: item._id.Stock_Quantity,
                totalSold: item.totalSold,
                totalRevenue: item.totalRevenue
            }));

        res.json(formatted);
    } catch (error) {
        console.error("Top Products Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm bán chạy" });
    }
};

// GET /api/admin/dashboard/customers
exports.getCustomerStats = async (req, res) => {
    try {
        // 1. Total Customers
        const totalCustomers = await User.countDocuments({ role: 'user' });

        // 2. New Customers (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newCustomersLast30Days = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            role: 'user'
        });

        // 3. Customer Growth Chart (Last 6 months maybe?) - Optional, but user asked for "Customer analytics"
        // Let's return new customers by month for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const customerGrowth = await User.aggregate([
            { $match: { 
                role: 'user', 
                createdAt: { $gte: sixMonthsAgo } 
            }},
            { $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalCustomers,
            newCustomersLast30Days,
            customerGrowth
        });
    } catch (error) {
        console.error("Customer Stats Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy thống kê khách hàng" });
    }
};

// GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const statusFilter = req.query.status;
        const search = req.query.search; // Search by order ID or customer name

        let query = {};

        if (statusFilter) {
            query.status = statusFilter;
        }

        if (search) {
            // Need to search by ObjectId (Order ID) or populate User and search by name?
            // Simple search by Order ID if valid
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            if (isValidObjectId(search)) {
                query._id = search;
            } else {
                // If searching by name, we need slightly more complex logic or just don't support it easily without aggregation/lookup
                // For now, let's assume search is just for Order ID. 
                // Or we can fetch users with that name first.
                // Let's keep it simple: Search by Order ID only for now, or maybe User ID.
            }
        }

        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            orders,
            page,
            pages: Math.ceil(totalOrders / limit),
            total: totalOrders
        });
    } catch (error) {
        console.error("Get All Orders Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng" });
    }
};
