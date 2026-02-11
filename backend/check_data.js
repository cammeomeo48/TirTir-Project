const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/product.model');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const products = await Product.find({}, 'Name Main_Concern Category_Slug').limit(50);
        console.log('Sample Data:');
        console.log(JSON.stringify(products, null, 2));

        const allConcerns = await Product.distinct('Main_Concern');
        console.log('All Unique Concerns:', allConcerns);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
