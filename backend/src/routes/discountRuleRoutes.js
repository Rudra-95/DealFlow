const express         = require("express");
const router          = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles  = require("../middleware/roleMiddleware");
const {
  getDiscountRules,
  updateDiscountRuleHandler,
} = require("../controllers/discountRuleController");

const adminOnly = [authenticateToken, authorizeRoles("ADMIN")];

// GET /api/admin/discount-rules
router.get("/", adminOnly, getDiscountRules);

// PUT /api/admin/discount-rules
// Identified by customer_tier + category in the request body (UNIQUE constraint)
router.put("/", adminOnly, updateDiscountRuleHandler);

module.exports = router;
