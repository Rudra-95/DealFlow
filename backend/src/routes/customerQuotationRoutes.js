const express = require("express");
const router = express.Router();
const { authenticateCustomer } = require("../middleware/customerAuthMiddleware");
const {
  getQuotationHandler,
  negotiateHandler,
  confirmHandler,
} = require("../controllers/customerQuotationController");

// All customer quotation routes require customer authentication
// This middleware validates the customer portal token and ensures
// the customer can only access their own quotation

// ─── GET /api/customer/quotation ───────────────────────────────────────────────
// Returns customer-safe quotation view (no cost/margin/risk data)
router.get("/quotation", authenticateCustomer, getQuotationHandler);

// ─── POST /api/customer/quotation/negotiate ────────────────────────────────────
// Customer submits negotiation request
// Body: { line_id, request_type, requested_discount, comment }
router.post("/quotation/negotiate", authenticateCustomer, negotiateHandler);

// ─── POST /api/customer/quotation/confirm ──────────────────────────────────────
// Customer confirms (accepts) the quotation
router.post("/quotation/confirm", authenticateCustomer, confirmHandler);

module.exports = router;
