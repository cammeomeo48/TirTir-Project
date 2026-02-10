const mongoose = require('mongoose');
const Product = require('./models/product.model');
require('dotenv').config();

const uri = process.env.MONGO_URI;

mongoose.connect(uri).then(async () => {
    try {
        console.log("Connected to DB. Fixing Image Paths...");

        const products = await Product.find({});
        let count = 0;

        for (const p of products) {
            let changed = false;

            // Fix Thumbnail Path
            if (p.Thumbnail_Images && p.Thumbnail_Images.includes('thumb.webp') && !p.Thumbnail_Images.includes('Main-Images')) {
                p.Thumbnail_Images = p.Thumbnail_Images.replace('/thumb.webp', '/Main-Images/thumb.webp');
                changed = true;
            }

            // Fix Gallery Images
            if (p.Gallery_Images && p.Gallery_Images.length > 0) {
                p.Gallery_Images = p.Gallery_Images.map(img => {
                    if (img.includes('.webp') && !img.includes('Main-Images')) {
                        // Assuming strict structure: products/ID/Main-Images/file.webp
                        // If current is products/ID/file.webp -> insert Main-Images
                        const parts = img.split('/');
                        const file = parts.pop();
                        return [...parts, 'Main-Images', file].join('/');
                    }
                    return img;
                });
                changed = true; // Array modified in place, but need to mark as changed for save logic check (Mongoose detects array changes)
            }

            if (changed) {
                await Product.updateOne({ _id: p._id }, {
                    $set: {
                        Thumbnail_Images: p.Thumbnail_Images,
                        Gallery_Images: p.Gallery_Images
                    }
                });
                count++;
                console.log(`Updated ${p.Product_ID}`);
            }
        }

        console.log(`Fixed paths for ${count} products.`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
});
