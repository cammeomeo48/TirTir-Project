const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Helper to recalculate total price
const calculateTotal = (cart) => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// 1. ADD TO CART
exports.addToCart = async (req, res) => {
    console.log("==========================================");
    console.log("DEBUG: POST /api/v1/cart/add called");
    console.log("1. Request Body received:", req.body);

    try {
        // DEFENSIVE CHECK 1: User
        if (!req.user || !req.user.id) {
            console.error("2. User Info: MISSING req.user or req.user.id");
            return res.status(401).json({ message: "Unauthorized: No user found in request" });
        }
        const userId = req.user.id;
        console.log("2. User Info:", userId);

        const { productId, quantity, shade } = req.body;

        // DEFENSIVE CHECK 2: Inputs
        if (!productId) {
            console.error("3. Validation: Missing productId");
            return res.status(400).json({ message: "ProductId is required" });
        }
        if (!quantity || quantity <= 0) {
            console.error("3. Validation: Invalid quantity", quantity);
            return res.status(400).json({ message: "Positive Quantity is required" });
        }

        // 3. Find Product
        console.log("3. Product finding for ID (String):", productId);
        const product = await Product.findOne({ Product_ID: productId });

        if (!product) {
            console.error("❌ Product NOT FOUND in DB for ID:", productId);
            return res.status(404).json({ message: "Product not found" });
        }
        console.log("✅ Product Found:", product.Name, "| ID:", product._id, "| Stock:", product.Stock_Quantity);

        // Normalize shade
        const finalShade = shade || '';
        console.log("   Final Shade used:", finalShade);

        // 4. Get Cart
        console.log("4. Finding User Cart...");
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            console.log("   Cart not found, creating new one.");
            cart = new Cart({
                user: userId,
                items: []
            });
        } else {
            console.log("   Cart found. Items count:", cart.items.length);
        }

        // Logic check stock
        let currentQtyInCart = 0;
        const existingItem = cart.items.find(
            p => p.product.toString() === productId && p.shade === finalShade
        );
        if (existingItem) {
            currentQtyInCart = existingItem.quantity;
        }

        console.log("   Stock Check -> Req:", quantity, "+ InCart:", currentQtyInCart, "vs Stock:", product.Stock_Quantity);
        if ((currentQtyInCart + quantity) > product.Stock_Quantity) {
            console.error("   ❌ Insufficient stock");
            return res.status(400).json({
                message: `Insufficient stock. Available: ${product.Stock_Quantity}, In Cart: ${currentQtyInCart}`
            });
        }

        // 5. Update Items
        const itemIndex = cart.items.findIndex(
            p => p.product.toString() === productId && p.shade === finalShade
        );

        if (itemIndex > -1) {
            console.log("   Updating existing item at index:", itemIndex);
            cart.items[itemIndex].quantity += quantity;
            cart.items[itemIndex].price = product.Price; // Update price check
        } else {
            console.log("   Pushing NEW item to array");
            cart.items.push({
                product: product._id, // IMPORTANT: Use the ObjectId from the FOUND product doc
                quantity: quantity,
                shade: finalShade,
                price: product.Price
            });
        }

        // Recalculate
        console.log("6. Recalculating Total...");
        // Fallback for missing prices is good, but let's keep it simple for debug
        let total = 0;
        cart.items.forEach(item => {
            total += (item.price || 0) * item.quantity;
        });
        cart.totalPrice = total;
        cart.recoveryNotificationSent = false; // Reset abandoned cart flag
        console.log("   Total Price:", total);

        await cart.save();
        console.log("✅ Cart Saved Successfully!");

        const populatedCart = await Cart.findById(cart._id).populate('items.product');
        res.status(200).json(populatedCart);

    } catch (error) {
        console.error("🔥 FATAL ERROR in addToCart:", error);
        console.error(error.stack); // PRINT FULL STACK
        res.status(500).json({ message: "Server error", error: error.message });
    }
    console.log("==========================================");
};

// 2. UDPATE CART ITEM (PUT)
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, shade, quantity } = req.body;

        // Note: quantity here is the NEW TARGET quantity, not delta
        if (quantity < 0) {
            return res.status(400).json({ message: "Quantity cannot be negative" });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(
            p => p.product.toString() === productId && p.shade === shade
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        // If quantity is 0, remove item
        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            // Validate Stock for the NEW quantity
            const product = await Product.findOne({ Product_ID: productId });
            if (!product) {
                // If product deleted, remove item
                cart.items.splice(itemIndex, 1);
            } else if (quantity > product.Stock_Quantity) {
                return res.status(400).json({
                    message: `Insufficient stock. Max available: ${product.Stock_Quantity}`
                });
            } else {
                cart.items[itemIndex].quantity = quantity;
                // Update price snapshot to current if needed, or keep original?
                // Usually keep original unless re-added, but here we update so maybe update price too?
                // Letting it update to ensure total accuracy
                cart.items[itemIndex].price = product.Price;
            }
        }

        cart.totalPrice = calculateTotal(cart);
        cart.recoveryNotificationSent = false; // Reset abandoned cart flag
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate('items.product');
        res.status(200).json(populatedCart);

    } catch (error) {
        console.error("Update Cart Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. REMOVE FROM CART (DELETE)
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, shade } = req.params;
        // Note: Shade might be "undefined" string if passed from some frontends, handle strictly

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Use strict filter
        const originalLength = cart.items.length;
        cart.items = cart.items.filter(
            item => !(item.product.toString() === productId && item.shade === shade)
        );

        if (cart.items.length === originalLength) {
            // Item check logic
            // Try check if shade was passed as "null" string
            if (shade === 'null') {
                cart.items = cart.items.filter(
                    item => !(item.product.toString() === productId && !item.shade)
                );
            }
        }

        cart.totalPrice = calculateTotal(cart);
        cart.recoveryNotificationSent = false; // Reset abandoned cart flag
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate('items.product');
        res.status(200).json(populatedCart);

    } catch (error) {
        console.error("Remove from Cart Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 4. CLEAR CART
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ user: userId });

        if (cart) {
            cart.items = [];
            cart.totalPrice = 0;
            await cart.save();
        }

        res.status(200).json({ message: "Cart cleared", items: [], totalPrice: 0 });

    } catch (error) {
        console.error("Clear Cart Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 5. GET CART (with automatic cleanup of null products)
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        let cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            // Return empty cart structure instead of 404 to allow frontend to handle gracefully
            return res.status(200).json({ items: [], totalPrice: 0 });
        }

        res.status(200).json(cart);

    } catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 6. GET CART COUNT (Badge)
exports.getCartCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ user: userId }); // No populate needed

        if (!cart) {
            return res.status(200).json({ count: 0 });
        }

        const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        res.status(200).json({ count });

    } catch (error) {
        console.error("Get Cart Count Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
