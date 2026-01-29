
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/product.model');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const productCount = await Product.countDocuments();
        console.log(`Total Products in DB: ${productCount}`);

        if (productCount > 0) {
            const firstProduct = await Product.findOne();
            console.log("Sample Product:", JSON.stringify(firstProduct, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkData();
