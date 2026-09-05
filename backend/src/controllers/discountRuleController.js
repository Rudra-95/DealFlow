const { getAllDiscountRules, updateDiscountRule } = require("../services/discountRuleService");

const VALID_TIERS           = ["BRONZE", "SILVER", "GOLD"];
const VALID_APPROVAL_LEVELS = ["NONE", "SALES_MANAGER", "FINANCE"];

// ─── GET /api/admin/discount-rules ───────────────────────────────────────────
async function getDiscountRules(req, res) {
  try {
    const rules = await getAllDiscountRules();
    return res.status(200).json({ success: true, rules });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch discount rules",
    });
  }
}

// ─── PUT /api/admin/discount-rules ───────────────────────────────────────────
async function updateDiscountRuleHandler(req, res) {
  const { customer_tier, category, max_discount_percent, approval_level } = req.body;

  // 1. Required fields
  if (!customer_tier || !category || max_discount_percent === undefined || !approval_level) {
    return res.status(400).json({
      success: false,
      message: "customer_tier, category, max_discount_percent and approval_level are all required",
    });
  }

  // 2. Enum guards — reject "PLATINUM", "ADMIN", etc. before touching the DB
  if (!VALID_TIERS.includes(customer_tier)) {
    return res.status(400).json({
      success: false,
      message: `customer_tier must be one of: ${VALID_TIERS.join(", ")}`,
    });
  }
  if (!VALID_APPROVAL_LEVELS.includes(approval_level)) {
    return res.status(400).json({
      success: false,
      message: `approval_level must be one of: ${VALID_APPROVAL_LEVELS.join(", ")}`,
    });
  }

  // 3. NaN-safe numeric validation — Number("abc") = NaN, NaN < 0 is false (silent bug)
  const discount = Number(max_discount_percent);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    return res.status(400).json({
      success: false,
      message: "max_discount_percent must be a number between 0 and 100",
    });
  }

  try {
    const rule = await updateDiscountRule({
      customer_tier,
      category,
      max_discount_percent: discount,
      approval_level,
    });
    return res.status(200).json({ success: true, message: "Discount rule updated", rule });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update discount rule",
    });
  }
}

module.exports = { getDiscountRules, updateDiscountRuleHandler };

