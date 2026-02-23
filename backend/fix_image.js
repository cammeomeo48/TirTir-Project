const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;

    // Find all products with external image URLs (not assets/ and not /uploads/)
    const allProducts = await db.collection('products').find({}).toArray();

    const externalImages = allProducts.filter(p =>
        p.Thumbnail_Images &&
        p.Thumbnail_Images.startsWith('http') &&
        !p.Thumbnail_Images.includes('localhost')
    );

    const fs = require('fs');
    fs.writeFileSync('external_images.txt', JSON.stringify(
        externalImages.map(p => ({ id: p.Product_ID, name: p.Name, thumb: p.Thumbnail_Images })),
        null, 2
    ));

    console.log('Products with external image URLs:', externalImages.length);
    mongoose.disconnect();
});
