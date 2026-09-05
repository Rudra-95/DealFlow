const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const {
  getSuggestionsHandler,
  getUpsellRulesHandler,
  createUpsellRuleHandler,
  getUpsellRuleHandler,
  updateUpsellRuleHandler,
  deleteUpsellRuleHandler,
} = require("../controllers/suggestionController");

// Roles that can view suggestions
const canView = [
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER"),
];

// Roles that can manage upsell rules
const canManageRules = [
  authenticateToken,
  authorizeRoles("ADMIN"),
];

// ─── GET /api/quotations/:id/suggestions ───────────────────────────────────────
// TASK 39: Get product recommendations for a quote
// Returns margin impact, priority ranking, and promotion flags
router.get("/:id/suggestions", canView, getSuggestionsHandler);

// ─── ADMIN: Upsell Rule Management ─────────────────────────────────────────────

// GET /api/admin/upsell-rules
router.get("/admin/upsell-rules", canManageRules, getUpsellRulesHandler);

// POST /api/admin/upsell-rules
router.post("/admin/upsell-rules", canManageRules, createUpsellRuleHandler);

// GET /api/admin/upsell-rules/:id
router.get("/admin/upsell-rules/:id", canManageRules, getUpsellRuleHandler);

// PUT /api/admin/upsell-rules/:id
router.put("/admin/upsell-rules/:id", canManageRules, updateUpsellRuleHandler);

// DELETE /api/admin/upsell-rules/:id
router.delete("/admin/upsell-rules/:id", canManageRules, deleteUpsellRuleHandler);

module.exports = router;
