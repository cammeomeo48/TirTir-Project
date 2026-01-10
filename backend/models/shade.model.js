const mongoose = require("mongoose");

const ShadeSchema = new mongoose.Schema(
  {
    No: Number,
    Shade_Code: String,
    Cushion_Line: String,
    Parent_ID: String,
    Shade_ID: String,
    Shade_Name: String,
    Hex_Code: String,
    R: Number,
    G: Number,
    B: Number,
    L: String,
    a: String,
    b: String,
    Skin_Tone: String,
    Skin_Type: String,
    Undertone: String,
    Finish_Type: String,
    Hydration: Number,
    Coverage: Number,
    Coverage_Profile: String,
    Oxidation_Level: Number,
    Oxidation_Risk_Level: String,
  },
  { collection: "shades" } 
);

module.exports = mongoose.model("Shade", ShadeSchema);
