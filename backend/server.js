require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const errorHandler = require('./middlewares/error');
const app = express();

// CORS Configuration - MUST BE FIRST
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static Files - Add CORS headers manually
app.use('/assets', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../frontend/tirtir-frontend/public/assets'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Serve uploaded files (avatars, etc.)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));


// Security Headers - Configure helmet to allow images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin images
  contentSecurityPolicy: false // Disable CSP for development (re-enable in production)
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(mongoSanitize()); // FIXME: Causes TypeError with Express 5 (req.query getter)

// HTTPS Enforcement (Production only)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

const shadeRoutes = require("./routes/shade.routes");
const productRoutes = require("./routes/product.routes");
const menuRoutes = require("./routes/menu.routes");
const { ensureSlugs } = require("./controllers/product.controller");
const paymentRoutes = require("./routes/payment.routes");

app.get("/", (req, res) => res.send("API Running"));
app.get("/api/v1/health", (req, res) => res.json({ ok: true, msg: "alive" })); 

// API Routes
app.use("/api/v1/shades", shadeRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/admin/products", require("./routes/admin.products.routes"));  
app.use("/api/v1/admin", require("./routes/admin.dashboard.routes"));
app.use("/api/v1/menus", menuRoutes);
app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1/cart", require("./routes/cart.routes"));
app.use("/api/v1/chat", require("./routes/chat.routes"));
app.use("/api/v1/orders", require("./routes/order.routes"));
app.use("/api/v1/users", require("./routes/user.routes"));
app.use("/api/v1/reviews", require("./routes/review.routes")); // Add Review Routes
app.use("/api/v1/inventory", require("./routes/inventory.routes"));
app.use("/api/v1/admin/stats", require("./routes/admin.stats.routes"));
app.use("/api/v1/analytics", require("./routes/analytics.routes"));
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/coupons", require("./routes/coupon.routes"));
app.use("/api/v1/ai", require("./routes/ai.routes"));

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
    await ensureSlugs(); // Auto-populate slugs
    app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
}

start();
