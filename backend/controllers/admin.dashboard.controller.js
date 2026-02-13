const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const { ORDER_STATUS } = require('../constants');

// GET /api/admin/dashboard/stats
exports.getStats = async (req, res) => {
    try {
        // 1. Total Orders
        const totalOrders = await Order.countDocuments();

        // 2. Total Revenue (excluding Cancelled)
        const revenueResult = await Order.aggregate([
            { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // 3. Total Customers
        const totalCustomers = await User.countDocuments({ role: 'user' });

        // 4. Low Stock Products (stock < 10)
        const lowStockProducts = await Product.countDocuments({
            Stock_Quantity: { $lt: 10 }
        });

        // Return in format expected by frontend
        res.json({
            totalOrders,
            totalRevenue,
            totalCustomers,
            lowStockProducts
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
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Transform to format expected by frontend: {labels: [], data: []}
        const labels = revenueData.map(item => {
            const date = new Date(item._id);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const data = revenueData.map(item => item.revenue);

        res.json({ labels, data });
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
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    category: { $first: '$items.category' }, // Note: items in order might not have category, need lookup if needed
                    price: { $first: '$items.price' },
                    image: { $first: '$items.image' },
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit }
        ]);

        // Optional: Populate more details if needed, but for now aggregate is faster
        // If we really need category and it's not in order items, we might need a $lookup
        // But let's check order model items. It has name, price, shade, image. No category.
        // Let's do a lookup to get current product category if needed.

        const topProductsWithDetails = await Product.populate(topProducts, {
            path: '_id',
            select: 'Product_Name Product_ID Category Thumbnail_Images'
        });

        // Format to match frontend interface: {product: {...}, salesCount, revenue}
        const formatted = topProductsWithDetails
            .filter(item => item._id) // Filter out products that might have been deleted
            .map(item => ({
                product: {
                    _id: item._id._id.toString(),
                    name: item._id.Product_Name || item.name,
                    sku: item._id.Product_ID,
                    mainImage: item._id.Thumbnail_Images && item._id.Thumbnail_Images.length > 0
                        ? item._id.Thumbnail_Images[0]
                        : item.image
                },
                salesCount: item.totalSold,
                revenue: item.totalRevenue
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
            {
                $match: {
                    role: 'user',
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
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
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 10;
        const skip = page ? (page - 1) * limit : 0;

        const statusFilter = req.query.status;
        const search = req.query.search;

        let query = {};

        if (statusFilter) {
            query.status = statusFilter;
        }

        if (search) {
            const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
            if (isValidObjectId(search)) {
                query._id = search;
            }
        }

        // If no page specified (dashboard widget), return simple array of recent orders
        if (!page) {
            const orders = await Order.find(query)
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(limit);

            return res.json(orders);
        }

        // If page specified (order management page), return paginated response
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
