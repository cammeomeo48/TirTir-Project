const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { ORDER_STATUS } = require('../constants');

// 1. TẠO ĐƠN HÀNG (CHECKOUT)
exports.createOrder = async (req, res) => {
    try {
        // Get userId from authenticated user (set by protect middleware)
        const userId = req.user.id;
        const { shippingAddress, paymentMethod } = req.body;

        // A. Lấy giỏ hàng của user
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống!" });
        }

        // B. Chuẩn bị dữ liệu items cho Order
        // (Lưu cứng giá và tên sản phẩm vào thời điểm mua)
        const orderItems = [];
        let calculatedTotal = 0;

        for (const item of cart.items) {
            // Kiểm tra sản phẩm còn tồn tại không
            if (!item.product) continue;

            // Logic kiểm tra tồn kho (Optional - có thể thêm sau)
            // if (item.product.Stock_Quantity < item.quantity) ...

            orderItems.push({
                product: item.product._id,
                name: item.product.Name,
                quantity: item.quantity,
                price: item.product.Price, // Lấy giá từ DB, không tin client
                shade: item.shade,
                image: item.product.Thumbnail_Images
            });

            calculatedTotal += item.product.Price * item.quantity;
        }

        // C. Tạo Order mới
        const newOrder = new Order({
            user: userId,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            totalAmount: calculatedTotal,
            status: ORDER_STATUS.PENDING
        });

        await newOrder.save();

        // D. Quan trọng: XÓA GIỎ HÀNG sau khi đặt thành công
        await Cart.findOneAndDelete({ user: userId });

        res.status(201).json({
            message: "Đặt hàng thành công!",
            orderId: newOrder._id
        });

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: "Lỗi Server khi tạo đơn hàng." });
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

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status: status },
            { new: true } // Trả về data mới sau khi update
        );

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        res.json({ message: "Cập nhật trạng thái thành công", order });
    } catch (error) {
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

        // (Optional) Nếu có trừ kho lúc đặt, thì ở đây phải cộng lại kho (Restock)
        // await restockProducts(order.items);

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