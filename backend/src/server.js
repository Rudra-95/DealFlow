const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const cors    = require("cors");

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

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, message: "DealFlow360 backend and database are running" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database connection failed", error: error.message });
  }
});

app.get("/api/test/db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS connected, NOW() AS server_time");
    res.json({ success: true, message: "Database connection successful", data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database connection failed", error: error.message });
  }
});

app.get("/api/test/server", (req, res) => {
  res.json({
    success: true,
    message: "DealFlow360 server is running",
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

// ─── Protected routes ─────────────────────────────────────────────────────────
app.get("/api/me", authenticateToken, getMe);

// ─── Phase 3 ──────────────────────────────────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/admin/discount-rules", discountRuleRoutes);

// ─── Phase 4/5/6 ─────────────────────────────────────────────────────────────
app.use("/api/quotations", quoteRoutes);
app.use("/api/approvals", approvalRoutes);

// ─── Phase 7 ──────────────────────────────────────────────────────────────────
app.use("/api/quotations", fulfillmentRoutes);

// ─── Phase 8 ──────────────────────────────────────────────────────────────────
app.use("/api/invoices", invoiceRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// ─── Phase 9 ──────────────────────────────────────────────────────────────────
app.use("/api/customer", customerQuotationRoutes);

// ─── Phase 10 ─────────────────────────────────────────────────────────────────
app.use("/api/quotations", suggestionRoutes);

// ─── Phase 11 ─────────────────────────────────────────────────────────────────
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/deal-health", dealHealthRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});