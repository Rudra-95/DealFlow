const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const {
  getAllIssuesHandler,
  getStalledDealsHandler,
  getAnomaliesHandler,
  checkQuoteHealthHandler,
} = require("../controllers/dealHealthController");

// Roles that can view deal health data
const canViewHealth = [
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_MANAGER", "FINANCE"),
];

// ─── GET /api/deal-health ───────────────────────────────────────────────────
// Returns all deal health issues (stalled + anomalies)
router.get("/", canViewHealth, getAllIssuesHandler);

// ─── GET /api/deal-health/stalled ───────────────────────────────────────────
// TASK 41: Returns stalled deals (> 3 days inactive)
router.get("/stalled", canViewHealth, getStalledDealsHandler);

// ─── GET /api/deal-health/anomalies ─────────────────────────────────────────
// TASK 42: Returns discount anomalies
router.get("/anomalies", canViewHealth, getAnomaliesHandler);

// ─── GET /api/deal-health/:id ───────────────────────────────────────────────
// Check health of a specific quote
router.get("/:id", canViewHealth, checkQuoteHealthHandler);

module.exports = router;
