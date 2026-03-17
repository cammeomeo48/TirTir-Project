require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const cats = await Product.distinct('Category');
  console.log('CATS=' + JSON.stringify(cats));
  
  const n1 = await Product.countDocuments({
    Category: { $in: ['Toner', 'Serum', 'Cream', 'Sunscreen', 'Cushion', 'Cleanser'] },
    Stock_Quantity: { $gt: 0 }
  });
  console.log('WITH_STOCK=' + n1);
  
  const n2 = await Product.countDocuments({
    Category: { $in: ['Toner', 'Serum', 'Cream', 'Sunscreen', 'Cushion', 'Cleanser'] }
  });
  console.log('NO_FILTER=' + n2);
  
  const total = await Product.countDocuments();
  console.log('TOTAL=' + total);
  
  const samples = await Product.find().limit(3).select('_id Name Category Stock_Quantity Skin_Type_Target Main_Concern');
  samples.forEach(s => console.log('SAMPLE=' + JSON.stringify(s)));
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
