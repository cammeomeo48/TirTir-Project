const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    sender: { type: String, enum: ['user', 'bot'], required: true },
    timestamp: { type: Date, default: Date.now },
    // Optional: product card data embedded in the bot reply
    productData: {
        id: String,
        name: String,
        price: Number,
        image: String,
        desc: String,
        slug: String,
    }
}, { _id: false }); // No separate _id for sub-documents

const ChatHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One document per user
        index: true,
    },
    messages: {
        type: [MessageSchema],
        default: [],
    },
    updatedAt: { type: Date, default: Date.now },
});

// Auto-update `updatedAt` on every save
ChatHistorySchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
