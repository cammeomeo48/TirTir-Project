const path = require('path');

/**
 * @desc    Upload product image
 * @route   POST /api/v1/upload/product
 * @access  Private (Admin)
 */
exports.uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate public URL
        // req.file.filename is like "products-123456789.jpg"
        // We serve static files from /uploads, so the URL is /uploads/products/...
        const imageUrl = `/uploads/products/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: imageUrl
            }
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

/**
 * @desc    Upload banner image
 * @route   POST /api/v1/upload/banner
 * @access  Private (Admin)
 */
exports.uploadBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const imageUrl = `/uploads/banners/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Banner uploaded successfully',
            data: {
                url: imageUrl
            }
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload banner',
            error: error.message
        });
    }
};
