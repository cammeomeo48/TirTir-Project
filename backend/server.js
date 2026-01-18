require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const shadeRoutes = require("./routes/shade.routes");
const productRoutes = require("./routes/product.routes");

app.get("/api/health", (req, res) => res.json({ ok: true, msg: "alive" }));

app.use("/api/shades", shadeRoutes);
app.use("/api/products", productRoutes);
app.use('/assets', express.static(path.join(__dirname, '../frontend/tirtir-frontend/public/assets')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
}

start();
