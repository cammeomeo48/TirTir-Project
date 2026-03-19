const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/product.model');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    const all = await Product.find().select('Name Product_ID Category Price');
    console.log(`--- Total Products: ${all.length} ---`);
    all.forEach(p => console.log(`[${p._id}] / [SKU: ${p.Product_ID}] / [Name: ${p.Name}] / [Category: ${p.Category}] / [Price: ${p.Price}]`));
    mongoose.disconnect();
  });
