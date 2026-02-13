const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Generic Multer Configuration Factory
 * @param {string} subDir - Subdirectory inside 'uploads' (e.g., 'avatars', 'products')
 * @returns {object} Multer upload instance
 */
const createUploader = (subDir) => {
    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, '..', 'uploads', subDir);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Configure storage
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            // Generate unique filename: type-timestamp-random.extension
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, `${subDir}-${uniqueSuffix}${ext}`);
        }
    });

    // File filter - only accept images
    const fileFilter = (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'), false);
        }
    };

    return multer({
        storage: storage,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB limit (increased for products)
        },
        fileFilter: fileFilter
    });
};

// Create specific uploaders
const avatarUploader = createUploader('avatars');
const productUploader = createUploader('products');
const bannerUploader = createUploader('banners');

module.exports = {
    uploadAvatar: avatarUploader.single('avatar'),
    uploadProductImage: productUploader.single('image'), // Expects field name 'image'
    uploadBanner: bannerUploader.single('banner') // Expects field name 'banner'
};
