require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    const products = await db.collection('products').find(
        { slug: { $in: ['mask-fit-red-cushion', 'waterism-glow-tint', 'milk-skin-toner', 'sos-serum'] } },
        { projection: { Name: 1, Thumbnail_Images: 1, Gallery_Images: 1, slug: 1, images: 1 } }
    ).toArray();
    console.log(JSON.stringify(products, null, 2));
    mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
