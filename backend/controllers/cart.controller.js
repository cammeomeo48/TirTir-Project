const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Add to Cart
exports.addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity, shade } = req.body;

        if (!userId || !productId || !quantity) {
            return res.status(400).json({ message: "UserId, ProductId, and Quantity are required" });
        }

        // Validate Product existence
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            // Check if product exists in cart
            const itemIndex = cart.items.findIndex(p => p.product.toString() === productId && p.shade === shade);

            if (itemIndex > -1) {
                // Update quantity
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Add new item
                cart.items.push({ product: productId, quantity, shade });
            }
        } else {
            // Create new cart
            cart = new Cart({
                user: userId,
                items: [{ product: productId, quantity, shade }]
            });
        }

        // CRITICAL: Recalculate Total Price using DB Prices
        let total = 0;
        for (const item of cart.items) {
            const prod = await Product.findById(item.product);
            if (prod) {
                total += prod.Price * item.quantity;
            }
        }
        cart.totalPrice = total;

        await cart.save();
        res.status(200).json(cart);

    } catch (error) {
        console.error("Add to Cart Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Cart
exports.getCart = async (req, res) => {
    try {
        const { userId } = req.query; // Or req.user.id if using middleware

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            return res.status(404).json({ message: "Cart empty" });
        }

        res.status(200).json(cart);

    } catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
