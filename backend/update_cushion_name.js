require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({ Name: String, Price: Number, Product_ID: String }, { strict: false }));
    const result = await Product.updateOne(
       { Product_ID: 'MK-RED-CUSHION-001' },
       { $set: { Name: 'Tirtir Mask Fit Red Cushion', Price: 35 } }
    );
    console.log("Update result:", result);
    
    // Verify
    const updated = await Product.findOne({ Product_ID: 'MK-RED-CUSHION-001' }, {Name: 1, Price: 1});
    console.log("Sản phẩm sau khi update:", updated.Name, "| Giá:", updated.Price);
    process.exit(0);
  });
