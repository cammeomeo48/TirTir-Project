require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const shadeRoutes = require("./routes/shade.routes");
const productRoutes = require("./routes/product.routes");
const menuRoutes = require("./routes/menu.routes");

app.get("/", (req, res) => res.send("API Running"));
app.get("/api/health", (req, res) => res.json({ ok: true, msg: "alive" }));

app.use("/api/shades", shadeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
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
// trigger restart
// restart trigger 2
// final alignment check restart
