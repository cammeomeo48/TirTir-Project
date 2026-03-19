const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/product.model');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to DB.");

    try {
        const targetIds = [
            '697c6c19968c8d02a8b9a3ff', // DEMO-REAL-LIFE
            '69844b2d74711b19797eb258', // TEST-STOCK-001
            '698452c0a7e9818e47d2c84c', // BULK-001
            '698452c0a7e9818e47d2c84f', // BULK-002
            '69904625a34232394bdae352'  // MK-RED-CUSHION-001 (duplicate)
        ];

        const result = await Product.deleteMany({ _id: { $in: targetIds } });
        console.log(`Successfully deleted ${result.deletedCount} junk/test products.`);

    } catch (err) {
        console.error("Error deleting products:", err);
    } finally {
        mongoose.disconnect();
    }
  })
  .catch(err => console.error(err));
