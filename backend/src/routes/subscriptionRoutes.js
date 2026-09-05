const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const {
  getSubscriptionsHandler,
  getSubscriptionHandler,
  updateSubscriptionHandler,
  cancelSubscriptionHandler,
} = require("../controllers/subscriptionController");

// Roles that can view subscriptions
const canView = [
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER", "FINANCE", "CUSTOMER"),
];

// Roles that can modify subscriptions
const canModify = [
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_MANAGER", "CUSTOMER"),
];

// ─── GET /api/subscriptions ────────────────────────────────────────────────────
// Returns subscriptions for the authenticated user or specified customer.
router.get("/", canView, getSubscriptionsHandler);

// ─── GET /api/subscriptions/:id ────────────────────────────────────────────────
// Returns a single subscription with billing details.
router.get("/:id", canView, getSubscriptionHandler);

// ─── PUT /api/subscriptions/:id ────────────────────────────────────────────────
// Update subscription (e.g., change quantity with proration).
// Shared API contract endpoint.
router.put("/:id", canModify, updateSubscriptionHandler);

// ─── POST /api/subscriptions/:id/cancel ────────────────────────────────────────
// Cancel an active subscription.
router.post("/:id/cancel", canModify, cancelSubscriptionHandler);

module.exports = router;
