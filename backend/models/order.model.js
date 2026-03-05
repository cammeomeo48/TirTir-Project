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
    enum: ['MOMO', 'VNPAY'],
    required: true
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    orderStatus: {
        type: String,
        enum: ['PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'],
        default: 'PROCESSING'
    },
    paymentTranId: { type: String }, // Lưu mã giao dịch của Momo/VNPay để dùng khi Refund
    paymentInfo: { // Lưu dữ liệu trả về từ VNPay/Momo để đối soát
        type: Object,
        default: {}
    },
    totalAmount: {
        type: Number,
        required: true
    },
    },
 { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);