const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const { getDashboardHandler } = require("../controllers/dashboardController");

// Roles that can view dashboard
const canViewDashboard = [
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_MANAGER", "FINANCE"),
];

// ─── GET /api/dashboard ─────────────────────────────────────────────────────
// TASK 40: Dashboard summary endpoint
// Returns total quotes, pending approvals, approved quotes, orders, and revenue
router.get("/", canViewDashboard, getDashboardHandler);

module.exports = router;
