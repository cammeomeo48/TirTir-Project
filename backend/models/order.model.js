// backend/models/order.model.js
const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require('../constants');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: String,       
            quantity: Number,
            price: Number,      
            shade: String,
            image: String
        }
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        // Tự động nhận:  'VNPAY', 'MOMO', 'CARD' từ file constants
        enum: Object.values(PAYMENT_METHOD), 
        default: PAYMENT_METHOD.VNPAY,
        required: true
    },
    paymentStatus: { // THÊM TRƯỜNG NÀY ĐỂ TRACKING
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING
    },
    paymentInfo: { // Lưu dữ liệu trả về từ VNPay/Momo để đối soát
        type: Object,
        default: {}
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);