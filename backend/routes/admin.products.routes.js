const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const productController = require('../controllers/product.controller');

router.post('/', protect, authorize('admin'), productController.createProduct);
router.post('/bulk-import', protect, authorize('admin'), productController.bulkImport);
router.put('/:id', protect, authorize('admin'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);
router.patch('/:id/stock', protect, authorize('admin'), productController.updateStock);

module.exports = router;
