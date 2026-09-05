const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const { getPendingHandler } = require("../controllers/approvalController");

// GET /api/approvals/pending
// Returns the actionable approval queue for the logged-in Manager or Finance user.
router.get(
  "/pending",
  authenticateToken,
  authorizeRoles("SALES_MANAGER", "FINANCE"),
  getPendingHandler
);

module.exports = router;
