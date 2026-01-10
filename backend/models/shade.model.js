const mongoose = require("mongoose");

const ShadeSchema = new mongoose.Schema(
  {
    // Link sang product.csv
    Product_ID: { type: String, required: true, index: true },

    Shade_Code: { type: String, required: true }, // 10C, 13N...
    Shade_Category_Name: { type: String, required: true }, // Mask Fit Red / Aura / ...
    Parent_ID: { type: String, required: true }, // SA / MA / DE
    Shade_ID: { type: String, required: true, unique: true, index: true }, // SA-10C

    Shade_Name: { type: String, required: true },
    Hex_Code: { type: String, required: true },

    // RGB
    R: { type: Number, required: true, min: 0, max: 255 },
    G: { type: Number, required: true, min: 0, max: 255 },
    B: { type: Number, required: true, min: 0, max: 255 },

    // LAB (number)
    L: { type: Number, required: true },
    a: { type: Number, required: true },
    b: { type: Number, required: true },

    // Attributes
    Skin_Tone: { type: String },
    Skin_Type: { type: String },
    Undertone: { type: String },
    Finish_Type: { type: String },

    Hydration: { type: Number },
    Coverage: { type: Number },
    Coverage_Profile: { type: String },

    Oxidation_Level: { type: Number },
    Oxidation_Risk_Level: { type: String },

    Shade_Image: { type: String },

    // Nếu sau này muốn mở rộng (Lip, etc) thì vẫn safe
    Shade_Type: { type: String, default: "Cushion" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shade", ShadeSchema);
