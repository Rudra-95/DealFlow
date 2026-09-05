const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const pool               = require("./config/db");
const authRoutes         = require("./routes/authRoutes");
const productRoutes      = require("./routes/productRoutes");
const discountRuleRoutes = require("./routes/discountRuleRoutes");
const quoteRoutes        = require("./routes/quoteRoutes");
const authenticateToken  = require("./middleware/authMiddleware");
const { getMe }          = require("./controllers/authController");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Public routes ────────────────────────────────────────────────────────────

// Health check — verifies both server + database connectivity
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      success: true,
      message: "DealFlow360 backend and database are running",
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Auth: POST /api/auth/register  &  POST /api/auth/login
app.use("/api/auth", authRoutes);

// ─── Protected routes ─────────────────────────────────────────────────────────

// GET /api/me  — SHARED CONTRACT — returns current user from JWT
// authMiddleware verifies the JWT before getMe runs
app.get("/api/me", authenticateToken, getMe);

// ─── Phase 3 routes ──────────────────────────────────────────────────────────

// GET /api/products  GET /api/products/:id
// POST /api/products   PUT /api/products/:id
app.use("/api/products", productRoutes);

// GET /api/admin/discount-rules   PUT /api/admin/discount-rules
app.use("/api/admin/discount-rules", discountRuleRoutes);

// ─── Phase 4 routes ──────────────────────────────────────────────────────────

// POST /api/quotes            GET /api/quotes
// GET  /api/quotes/:id        PUT /api/quotes/:id
// POST /api/quotes/:id/lines  PUT /api/quotes/:id/lines/:lineId
// DELETE /api/quotes/:id/lines/:lineId
app.use("/api/quotes", quoteRoutes);

// ─── Future route groups (uncomment as phases are completed) ─────────────────
// app.use("/api/approvals",           approvalRoutes);
// app.use("/api/fulfillment",         fulfillmentRoutes);
// app.use("/api/subscriptions",       subscriptionRoutes);
// app.use("/api/invoices",            invoiceRoutes);
// app.use("/api/deal-health",         dealHealthRoutes);
// app.use("/api/reports",             reportRoutes);
// app.use("/api/customer/quotation",  customerRoutes);
// app.use("/api/dashboard",           dashboardRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
