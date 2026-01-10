const express = require("express");
const Shade = require("../models/shade.model");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const data = await Shade.find().limit(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
