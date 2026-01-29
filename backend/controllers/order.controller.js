const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// 1. TẠO ĐƠN HÀNG (CHECKOUT)
exports.createOrder = async (req, res) => {
    try {
        const { userId, shippingAddress, paymentMethod } = req.body;

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
            status: 'Pending'
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
        const { userId } = req.query; // Sau này sẽ lấy từ Token
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. LẤY CHI TIẾT 1 ĐƠN HÀNG
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};