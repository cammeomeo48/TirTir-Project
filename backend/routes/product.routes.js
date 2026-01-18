const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductDetail);

module.exports = router;