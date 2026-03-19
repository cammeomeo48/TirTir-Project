const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/tirtir')
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({ Name: String }, { strict: false }));
    const products = await Product.find({ Name: /Glow/i });
    console.log("Products with Glow:", products.map(p => p.Name));
    const products2 = await Product.find({ Name: /Serum/i });
    console.log("Products with Serum:", products2.map(p => p.Name));
    process.exit(0);
  });
