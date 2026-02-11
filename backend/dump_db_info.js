const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/product.model');

async function dumpConcerns() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const concerns = await Product.aggregate([
            { $group: { _id: "$Main_Concern", count: { $sum: 1 } } }
        ]);

        console.log('Concerns in DB:');
        console.log(JSON.stringify(concerns, null, 2));

        const categories = await Product.aggregate([
            { $group: { _id: "$Category_Slug", count: { $sum: 1 } } }
        ]);
        console.log('Categories in DB:');
        console.log(JSON.stringify(categories, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dumpConcerns();
