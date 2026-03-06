const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const StockHistory = require('../models/stock.history.model');
const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../constants');
const { createNotification } = require('./notification.controller');
// Lazy-load to avoid circular dep: shipping.controller → order.model ← order.controller
const getShippingController = () => require('./shipping.controller');

// 1. TẠO ĐƠN HÀNG (CHECKOUT)
// Implements: MongoDB ClientSession Transactions & Atomic Updates
exports.createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const { shippingAddress, paymentMethod } = req.body;

        const cart = await Cart.findOne({ user: userId }).populate('items.product').session(session);

        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Giỏ hàng trống!" });
        }

        const orderItems = [];
        let calculatedTotal = 0;
        const reservedProducts = [];

        // --- ATOMIC RESERVATION LOOP IN TRANSACTION ---
        for (const item of cart.items) {
            if (!item.product) continue;

            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: item.product._id,
                    Stock_Quantity: { $gte: item.quantity }
                },
                {
                    $inc: {
                        Stock_Quantity: -item.quantity,
                        Stock_Reserved: item.quantity
                    }
                },
                { new: true, session }
            );

            if (!updatedProduct) {
                // If the product is out of stock, Abort Transaction completely
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    message: `Product out of stock or insufficient quantity for: ${item.product.Name}`
                });
            }

            reservedProducts.push({ id: item.product._id, qty: item.quantity, price: item.product.Price });

            orderItems.push({
                product: item.product._id,
                name: item.product.Name,
                quantity: item.quantity,
                price: item.product.Price,
                shade: item.shade,
                image: item.product.Thumbnail_Images
            });

            calculatedTotal += item.product.Price * item.quantity;
        }

        // --- CREATE ORDER ---
        const newOrder = new Order({
            user: userId,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            totalAmount: calculatedTotal,
            status: ORDER_STATUS.PENDING
        });

        const savedOrder = await newOrder.save({ session });

        // --- LOG HISTORY (RESERVE ACTION) ---
        for (const reserved of reservedProducts) {
            await StockHistory.create([{
                product: reserved.id,
                action: 'Reserve',
                change_type: 'Decrease',
                source_id: savedOrder._id.toString(),
                balance_before: 0,
                balance_after: 0,
                changeAmount: reserved.qty,
                reason: 'Order Placed (Reserved)',
                performedBy: userId
            }], { session });
        }

        await Cart.findOneAndDelete({ user: userId }).session(session);

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: "Đặt hàng thành công!",
            orderId: savedOrder._id
        });

    } catch (error) {
        console.error("Create Order Error:", error);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: "Lỗi Server khi tạo đơn hàng. (Transaction Aborted)" });
    }
};

// 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA USER
exports.getMyOrders = async (req, res) => {
    try {
        // Get userId from authenticated user (set by protect middleware)
        const userId = req.user.id;

        // Sort: { createdAt: -1 } nghĩa là giảm dần (mới nhất nằm trên cùng)
        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng" });
    }
};

// 3. CHI TIẾT ĐƠN HÀNG
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        // Security: Check if the order belongs to the requesting user (unless admin)
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. CẬP NHẬT TRẠNG THÁI (Dành cho Admin)
// Flow: Pending -> Processing -> Shipped -> Delivered
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        const validStatuses = Object.values(ORDER_STATUS);
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        }

        const order = await Order.findById(orderId).populate('items.product');

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        const oldStatus = order.status;

        // --- STOCK MANAGEMENT LOGIC ---

        // 1. Pending -> Processing: CONFIRM Stock (Deduct from Reserved)
        // Note: Stock was already deducted from Stock_Quantity when Order was placed (Pending).
        // It is currently in Stock_Reserved. We just need to remove it from Stock_Reserved.
        if (status === 'Processing' && oldStatus === 'Pending') {
            for (const item of order.items) {
                // Confirm Sale: Remove from Reserved
                const product = await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { Stock_Reserved: -item.quantity }
                }, { new: true });

                // Log History (Sale)
                if (product) {
                    await StockHistory.create({
                        product: product._id,
                        action: 'Sale',
                        change_type: 'Decrease', // Technically no change to Available Stock, but leaving system
                        source_id: order._id.toString(),
                        balance_before: product.Stock_Quantity, // Available stays same
                        balance_after: product.Stock_Quantity,
                        changeAmount: item.quantity,
                        reason: 'Order Confirmed (Reserved Released)',
                        performedBy: req.user.id
                    });
                }
            }
        }

        // 2. Pending -> Cancelled: RELEASE Stock (Reserved -> Available)
        if (status === 'Cancelled' && oldStatus === 'Pending') {
            for (const item of order.items) {
                // Return to Stock
                const product = await Product.findByIdAndUpdate(item.product._id, {
                    $inc: {
                        Stock_Quantity: item.quantity,
                        Stock_Reserved: -item.quantity
                    }
                }, { new: true });

                if (product) {
                    await StockHistory.create({
                        product: product._id,
                        action: 'Release',
                        change_type: 'Increase',
                        source_id: order._id.toString(),
                        balance_before: product.Stock_Quantity - item.quantity,
                        balance_after: product.Stock_Quantity,
                        changeAmount: item.quantity,
                        reason: 'Order Cancelled (Stock Returned)',
                        performedBy: req.user.id
                    });
                }
            }
        }

        // 3. Processing/Shipped -> Cancelled: RESTOCK (Refund)
        // Stock was already fully deducted (Reserved cleared). Need to add back to Available.
        if (status === 'Cancelled' && (oldStatus === 'Processing' || oldStatus === 'Shipped')) {
            for (const item of order.items) {
                const product = await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { Stock_Quantity: item.quantity }
                }, { new: true });

                if (product) {
                    await StockHistory.create({
                        product: product._id,
                        action: 'Refund',
                        change_type: 'Increase',
                        source_id: order._id.toString(),
                        balance_before: product.Stock_Quantity - item.quantity,
                        balance_after: product.Stock_Quantity,
                        changeAmount: item.quantity,
                        reason: 'Order Cancelled (Restock)',
                        performedBy: req.user.id
                    });
                }
            }
        }

        // --- END STOCK LOGIC ---

        // ─── GHN: Create Shipping Order when Admin marks Shipped ─────────────
        if (status === 'Shipped' && oldStatus === 'Processing') {
            try {
                const { createGHNOrder } = getShippingController();
                await createGHNOrder(order);
            } catch (ghnErr) {
                // GHN failed → leave order at Processing (createGHNOrder already rolled back status)
                return res.status(ghnErr.statusCode || 502).json({
                    message: ghnErr.message,
                    hint: 'Order status reverted to Processing. Please try again or create GHN shipment manually.'
                });
            }
        }

        order.status = status;
        const updatedOrder = await order.save();

        // ─── Gửi notification cho chủ đơn hàng ────────────────────────────────
        const orderIdStr = order._id.toString();
        const shortId = orderIdStr.slice(-6).toUpperCase();
        const notifMap = {
            Processing: {
                title: '🛒 Đơn hàng đang xử lý',
                message: `Đơn hàng #${shortId} đã được xác nhận và đang được xử lý.`
            },
            Shipped: {
                title: '🚚 Đơn hàng đang giao',
                message: `Đơn hàng #${shortId} đã được giao cho đơn vị vận chuyển.`
            },
            Delivered: {
                title: '✅ Giao hàng thành công',
                message: `Đơn hàng #${shortId} đã được giao thành công. Cảm ơn bạn đã mua sắm!`
            },
            Cancelled: {
                title: '❌ Đơn hàng đã bị hủy',
                message: `Đơn hàng #${shortId} đã bị hủy. Liên hệ hỗ trợ nếu cần trợ giúp.`
            }
        };

        if (notifMap[status]) {
            const userIdToNotify = order.user?._id || order.user;
            await createNotification(
                userIdToNotify,
                'order',
                notifMap[status].title,
                notifMap[status].message,
                `/account/orders`
            );
        }
        // ──────────────────────────────────────────────────────────────────────

        res.json({ message: "Cập nhật trạng thái thành công", order: updatedOrder });
    } catch (error) {
        console.error("Update Order Error:", error);
        res.status(500).json({ message: error.message });
    }
};
// 5. HỦY ĐƠN HÀNG (User)
exports.cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id; // Sau này lấy từ Token

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        // Chỉ cho phép hủy khi trạng thái là Pending
        if (order.status !== 'Pending') {
            return res.status(400).json({
                message: "Không thể hủy đơn hàng này vì đã được xử lý hoặc vận chuyển."
            });
        }

        order.status = 'Cancelled';
        await order.save();

        // FIX: Restock Logic (Release Reserved Stock)
        for (const item of order.items) {
            // Return to Stock: Increase Available, Decrease Reserved
            const product = await Product.findByIdAndUpdate(item.product._id, {
                $inc: {
                    Stock_Quantity: item.quantity,
                    Stock_Reserved: -item.quantity
                }
            }, { new: true });

            if (product) {
                // Log History
                await StockHistory.create({
                    product: product._id,
                    action: 'Release',
                    change_type: 'Increase',
                    source_id: order._id.toString(),
                    balance_before: product.Stock_Quantity - item.quantity,
                    balance_after: product.Stock_Quantity,
                    changeAmount: item.quantity,
                    reason: 'Order Cancelled by User (Stock Returned)',
                    performedBy: userId
                });
            }
        }

        res.json({ message: "Đã hủy đơn hàng thành công", order });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// 6. THEO DÕI ĐƠN HÀNG (Tracking Timeline)
exports.getOrderTracking = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).select('status createdAt updatedAt');

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        // Giả lập Timeline dựa trên trạng thái
        const timeline = [
            { status: "Đã đặt hàng", time: order.createdAt, done: true },
            { status: "Đang xử lý", time: null, done: order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered' },
            { status: "Đã giao cho ĐVVC", time: null, done: order.status === 'Shipped' || order.status === 'Delivered' },
            { status: "Giao hàng thành công", time: order.status === 'Delivered' ? order.updatedAt : null, done: order.status === 'Delivered' }
        ];

        // Nếu đã hủy thì timeline khác
        if (order.status === 'Cancelled') {
            timeline.push({ status: "Đã hủy", time: order.updatedAt, done: true });
        }

        res.json({
            orderId: order._id,
            currentStatus: order.status,
            timeline: timeline
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// 7. ĐẶT LẠI (Reorder) -> Thêm items từ đơn cũ vào Cart
exports.reorder = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        // 1. Lấy đơn hàng cũ
        const oldOrder = await Order.findById(orderId);
        if (!oldOrder) {
            return res.status(404).json({ message: "Đơn hàng cũ không tồn tại" });
        }

        // 2. Tìm hoặc Tạo Giỏ Hàng mới
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [], totalPrice: 0 });
        }

        // 3. Đẩy items cũ vào giỏ (Merge logic)
        for (const item of oldOrder.items) {
            // Kiểm tra xem sản phẩm còn bán không (Optional)

            const existingItemIndex = cart.items.findIndex(
                p => p.product.toString() === item.product.toString() && p.shade === item.shade
            );

            if (existingItemIndex > -1) {
                // Nếu đã có trong giỏ -> Cộng thêm số lượng
                cart.items[existingItemIndex].quantity += item.quantity;
            } else {
                // Nếu chưa có -> Thêm mới
                cart.items.push({
                    product: item.product,
                    quantity: item.quantity,
                    shade: item.shade
                });
            }
        }

        // 4. Tính lại tổng tiền (Quan trọng: Dùng giá hiện tại từ Product DB)
        let total = 0;
        for (const item of cart.items) {
            const prod = await Product.findById(item.product);
            if (prod) {
                total += prod.Price * item.quantity;
            }
        }
        cart.totalPrice = total;

        await cart.save();

        res.json({ message: "Đã thêm sản phẩm vào giỏ hàng!", cartSize: cart.items.length });

    } catch (error) {
        console.error("Reorder Error:", error);
        res.status(500).json({ message: "Lỗi server khi đặt lại đơn" });
    }
};