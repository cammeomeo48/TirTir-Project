const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./backend/models/order.model');

async function checkOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const momoOrders = await Order.find({ paymentMethod: 'MOMO' });
        console.log(`Found ${momoOrders.length} orders with MOMO payment method.`);
        if (momoOrders.length > 0) {
            console.log('Sample MOMO Order:', JSON.stringify(momoOrders[0], null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOrders();
