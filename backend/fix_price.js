require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({ Name: String, Price: Number }, { strict: false }));
    const product = await Product.findOneAndUpdate(
       { Name: /Mask Fit Red Cushion/i, Price: 24 },
       { $set: { Price: 35 } },
       { new: true }
    );
    if (product) {
       console.log("Updated product:", product.Name, "to Price:", product.Price);
    } else {
       console.log("Not found.");
    }
    process.exit(0);
  });
