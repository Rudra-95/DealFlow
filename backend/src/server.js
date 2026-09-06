const express = require("express");
const cors    = require("cors");
const path    = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const pool                     = require("./config/db");
const authRoutes               = require("./routes/authRoutes");
const productRoutes            = require("./routes/productRoutes");
const discountRuleRoutes       = require("./routes/discountRuleRoutes");
const quoteRoutes              = require("./routes/quoteRoutes");
const approvalRoutes           = require("./routes/approvalRoutes");
const fulfillmentRoutes        = require("./routes/fulfillmentRoutes");
const invoiceRoutes            = require("./routes/invoiceRoutes");
const subscriptionRoutes       = require("./routes/subscriptionRoutes");
const customerQuotationRoutes  = require("./routes/customerQuotationRoutes");
const suggestionRoutes         = require("./routes/suggestionRoutes");
const dashboardRoutes          = require("./routes/dashboardRoutes");
const dealHealthRoutes         = require("./routes/dealHealthRoutes");
const authenticateToken        = require("./middleware/authMiddleware");
const { getMe }                = require("./controllers/authController");

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

// ─── Shared-contract test endpoints ──────────────────────────────────────────

// GET /api/test/db  — confirms database connection is alive
app.get("/api/test/db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS connected, NOW() AS server_time");
    res.json({
      success: true,
      message: "Database connection successful",
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// GET /api/test/server  — confirms express server is alive (no DB required)
app.get("/api/test/server", (req, res) => {
  res.json({
    success: true,
    message: "DealFlow360 server is running",
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    timestamp: new Date().toISOString(),
  });
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

// ─── Phase 4/5/6 routes ──────────────────────────────────────────────────────────

// Quotes + lines + submit + approval workflow actions
// SHARED CONTRACT: /api/quotations (not /api/quotes)
app.use("/api/quotations", quoteRoutes);

// GET /api/approvals/pending  (Manager / Finance queue)
app.use("/api/approvals", approvalRoutes);

// ─── Phase 7 routes ───────────────────────────────────────────────────────────

// GET  /api/quotations/:id/fulfillment-suggestion
// GET  /api/quotations/:id/fulfillment
// POST /api/quotations/:id/fulfillment/accept
// POST /api/quotations/:id/fulfillment/override
app.use("/api/quotations", fulfillmentRoutes);

// ─── Phase 8 routes ───────────────────────────────────────────────────────────

// GET  /api/invoices
// GET  /api/invoices/:id
// POST /api/invoices/:id/payment
app.use("/api/invoices", invoiceRoutes);

// GET  /api/subscriptions
// GET  /api/subscriptions/:id
// PUT  /api/subscriptions/:id
app.use("/api/subscriptions", subscriptionRoutes);

// ─── Phase 9 routes ───────────────────────────────────────────────────────────

// GET  /api/customer/quotation
// POST /api/customer/quotation/negotiate
// POST /api/customer/quotation/confirm
app.use("/api/customer", customerQuotationRoutes);

// ─── Phase 10 routes ──────────────────────────────────────────────────────────

// GET  /api/quotations/:id/suggestions (Task 39 - Upsell/Cross-Sell)
// GET  /api/admin/upsell-rules
// POST /api/admin/upsell-rules
app.use("/api/quotations", suggestionRoutes);

// ─── Phase 11 routes ──────────────────────────────────────────────────────────

// GET /api/dashboard (Task 40 - Dashboard Summary)
app.use("/api/dashboard", dashboardRoutes);

// GET /api/deal-health (Tasks 41 & 42 - Stalled Deals & Discount Anomalies)
// GET /api/deal-health/stalled
// GET /api/deal-health/anomalies
// GET /api/deal-health/:id
app.use("/api/deal-health", dealHealthRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});