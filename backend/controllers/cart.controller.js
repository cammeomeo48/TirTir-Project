const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Add to Cart
exports.addToCart = async (req, res) => {
    try {
        // Get userId from authenticated user (set by protect middleware)
        const userId = req.user.id;
        const { productId, quantity, shade } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ message: "ProductId and Quantity are required" });
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
        // Optimize: Fetch all products in one query to avoid N+1 problem
        const productIds = cart.items.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } }).select('Price');
        
        const priceMap = {};
        products.forEach(p => { priceMap[p._id.toString()] = p.Price; });

        let total = 0;
        for (const item of cart.items) {
            const price = priceMap[item.product.toString()];
            if (price !== undefined) {
                total += price * item.quantity;
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
        // Get userId from authenticated user (set by protect middleware)
        const userId = req.user.id;

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
