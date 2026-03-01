require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;

    // Tìm Gift Card products
    const giftCards = await db.collection('products').find(
        { $or: [{ Product_ID: /gift/i }, { Name: /gift/i }] },
        { projection: { Name: 1, Product_ID: 1, Stock_Quantity: 1, Stock_Reserved: 1, slug: 1 } }
    ).toArray();

    console.log('Gift Cards:');
    console.log(JSON.stringify(giftCards, null, 2));

    mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
