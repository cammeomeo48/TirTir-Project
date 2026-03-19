const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/product.model');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to DB.");

    // Query suspicious products
    const suspicious = await Product.find({
        $or: [
            { Name: /Bulk|Test|Demo|Sản Phẩm/i }
        ]
    });
    
    console.log("--- Suspicious Products ---");
    suspicious.forEach(p => console.log(`[${p._id}] / [SKU: ${p.Product_ID}] / [Name: ${p.Name}] / [Category: ${p.Category}] / [createdAt: ${p.createdAt}]`));

    // Check for duplicate names
    const allProducts = await Product.find().select('Name Product_ID Category createdAt');
    const nameMap = {};
    allProducts.forEach(p => {
        const key = String(p.Name).trim();
        if (!nameMap[key]) nameMap[key] = [];
        nameMap[key].push(p);
    });

    console.log("\n--- Products with 'GIFT CARD' in Name ---");
    const giftCards = await Product.find({ Name: /GIFT CARD/i });
    giftCards.forEach(p => console.log(`[${p._id}] / [SKU: ${p.Product_ID}] / [Name: ${p.Name}] / [Category: ${p.Category}]`));

    console.log("\n--- Duplicate Name Products ---");
    let hasDups = false;
    for (const [name, list] of Object.entries(nameMap)) {
        if (list.length > 1) {
            hasDups = true;
            console.log(`\nDuplicate Name: "${name}" (${list.length} instances):`);
            list.forEach(p => console.log(`  - [${p._id}] / [SKU: ${p.Product_ID}] / [createdAt: ${p.createdAt}]`));
        }
    }
    if (!hasDups) console.log("None.");

    mongoose.disconnect();
  })
  .catch(err => console.error(err));
