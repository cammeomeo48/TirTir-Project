require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to Atlas!");
    const Product = mongoose.model('Product', new mongoose.Schema({ Name: String, Category: String }, { strict: false }));
    const products = await Product.find({ Name: /Glow/i });
    console.log("Products with Glow:", products.map(p => p.Name));
    
    const serums = await Product.find({ Name: /Serum/i });
    console.log("Products with Serum:", serums.map(p => p.Name));

    const exactMatch = await Product.find({ Name: "Serum Tirtir Glow" });
    if (exactMatch.length > 0) {
      console.log("FOUND HARDCODED IN DB! Deleting...");
      await Product.deleteMany({ Name: "Serum Tirtir Glow" });
      console.log("Deleted from DB.");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
