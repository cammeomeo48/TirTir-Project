const http = require('http');
require('dotenv').config();

// Test tạo order với COD
const mongoose = require('mongoose');

// In ra PAYMENT_METHOD constants
const { PAYMENT_METHOD } = require('./constants');
console.log('PAYMENT_METHOD:', PAYMENT_METHOD);
console.log('COD exists:', 'COD' in PAYMENT_METHOD);

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Order = require('./models/order.model');

    // Thử validate 1 order với paymentMethod COD
    const testOrder = new Order({
        user: new mongoose.Types.ObjectId(),
        items: [],
        shippingAddress: { fullName: 'Test', phone: '0901234567', address: '123', city: 'HCM' },
        paymentMethod: 'COD',
        totalAmount: 10,
    });

    const validationErr = testOrder.validateSync();
    if (validationErr) {
        console.log('VALIDATION ERROR:', JSON.stringify(validationErr.errors, null, 2));
    } else {
        console.log('✅ Validation PASSED - COD is accepted by schema');
    }

    console.log('Schema enum for paymentMethod:', Order.schema.path('paymentMethod').enumValues);

    mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
