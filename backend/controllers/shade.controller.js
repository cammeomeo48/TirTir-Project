const Shade = require("../models/shade.model");

exports.getShades = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit || 50), 200);

        const filter = {};
        if (req.query.productId) filter.Product_ID = req.query.productId;
        if (req.query.parentId) filter.Parent_ID = req.query.parentId;
        if (req.query.shadeType) filter.Shade_Type = req.query.shadeType;

        const data = await Shade.find(filter).limit(limit).sort({ No: 1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getShadeById = async (req, res) => {
    try {
        const item = await Shade.findOne({ Shade_ID: req.params.shadeId });
        if (!item) return res.status(404).json({ message: "Shade not found" });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
