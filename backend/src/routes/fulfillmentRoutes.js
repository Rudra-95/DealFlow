const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const {
  getSuggestionHandler,
  getAllocationsHandler,
  acceptSplitHandler,
  manualOverrideHandler,
} = require("../controllers/fulfillmentController");

// Roles that can view fulfillment data
const canView  = [
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER", "FINANCE"),
];

// Roles that can act on fulfillment (accept / override)
const canAct = [
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_MANAGER"),
];

// ─── GET /api/quotations/:id/fulfillment-suggestion ───────────────────────────
// Returns the automatic warehouse split suggestion for an approved quote.
router.get("/:id/fulfillment-suggestion", canView, getSuggestionHandler);

// ─── GET /api/quotations/:id/fulfillment ──────────────────────────────────────
// Returns committed fulfillment allocations (after accept or override).
// Maps to shared contract: GET /api/fulfillment/:id
router.get("/:id/fulfillment", canView, getAllocationsHandler);

// ─── POST /api/quotations/:id/fulfillment/accept ──────────────────────────────
// Accepts the system-suggested warehouse split and reduces inventory.
router.post("/:id/fulfillment/accept", canAct, acceptSplitHandler);

// ─── POST /api/quotations/:id/fulfillment/override ────────────────────────────
// Accepts a user-defined warehouse split and reduces inventory.
router.post("/:id/fulfillment/override", canAct, manualOverrideHandler);

module.exports = router;
