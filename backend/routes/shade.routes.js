const express = require("express");
const router = express.Router();
const shadeController = require("../controllers/shade.controller");

router.get("/", shadeController.getShades);
router.get("/:shadeId", shadeController.getShadeById);

module.exports = router;