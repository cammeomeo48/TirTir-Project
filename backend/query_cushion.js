require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({ Name: String, Category: String, Price: Number, Product_ID: String }, { strict: false }));
    const products = await Product.find({ Name: /Mask Fit Red Cushion/i }, {Name: 1, Category: 1, Price: 1, Product_ID: 1});
    console.log("Tìm thấy các sản phẩm sau:");
    products.forEach(p => console.log(`- Tên: "${p.Name}", Giá: $${p.Price}, Danh mục: ${p.Category}, Mã SP (Product_ID): ${p.Product_ID}, _id: ${p._id}`));
    process.exit(0);
  });
