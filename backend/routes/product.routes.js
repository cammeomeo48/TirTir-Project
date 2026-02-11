const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { protect, authorize } = require('../middlewares/auth');

router.get("/", productController.getAllProducts);

// Advanced Search & Filter Routes
router.get('/search', productController.advancedSearch);
router.get('/search/suggestions', productController.getSearchSuggestions);
router.get('/filters', productController.getProductFilters);

// Admin Stock Routes (Must be before /:id to avoid conflict)
router.get("/low-stock", protect, authorize('admin'), productController.getLowStockProducts);
router.get("/:id/stock-history", protect, authorize('admin'), productController.getStockHistory);

router.get("/:id", productController.getProductDetail);

module.exports = router;