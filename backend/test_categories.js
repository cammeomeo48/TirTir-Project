require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({ Name: String, Category: String, Price: Number }, { strict: false }));
    const products = await Product.find({}, {Name: 1, Category: 1, Price: 1});
    console.log("All Products:");
    products.forEach(p => console.log(`- ${p.Name} (${p.Category}) [$${p.Price}]`));
    process.exit(0);
  });
