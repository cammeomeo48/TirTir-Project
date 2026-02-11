const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/order.model');

async function getLatestOrder() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const order = await Order.findOne().sort({ createdAt: -1 });
        if (order) {
            console.log(JSON.stringify({
                orderId: order._id,
                amount: order.totalAmount,
                status: order.status
            }, null, 2));
        } else {
            console.log("No orders found");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getLatestOrder();