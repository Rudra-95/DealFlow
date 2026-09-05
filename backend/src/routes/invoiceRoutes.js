const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const {
  getInvoicesHandler,
  getInvoiceHandler,
  processPaymentHandler,
  cancelInvoiceHandler,
} = require("../controllers/invoiceController");

// Roles that can view invoices
const canView = [
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER", "FINANCE", "CUSTOMER"),
];

// Roles that can process payments
const canPay = [
  authenticateToken,
  authorizeRoles("ADMIN", "FINANCE", "CUSTOMER"),
];

// Roles that can cancel invoices
const canCancel = [
  authenticateToken,
  authorizeRoles("ADMIN", "FINANCE"),
];

// ─── GET /api/invoices ─────────────────────────────────────────────────────────
// Returns all invoices visible to the authenticated user.
router.get("/", canView, getInvoicesHandler);

// ─── GET /api/invoices/:id ─────────────────────────────────────────────────────
// Returns a single invoice with payment history.
router.get("/:id", canView, getInvoiceHandler);

// ─── POST /api/invoices/:id/payment ────────────────────────────────────────────
// Process payment for an invoice (UNPAID → PAID).
// Shared API contract endpoint.
router.post("/:id/payment", canPay, processPaymentHandler);

// ─── POST /api/invoices/:id/cancel ─────────────────────────────────────────────
// Cancel an unpaid invoice.
router.post("/:id/cancel", canCancel, cancelInvoiceHandler);

module.exports = router;
