const {
  getSuggestionsForQuote,
  getUpsellRules,
  createUpsellRule,
  getUpsellRuleById,
  updateUpsellRule,
  deleteUpsellRule,
} = require("../services/suggestionService");

// ─── Helper — parse and validate :id param ────────────────────────────────────
function parseId(raw) {
  const id = parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ─── GET /api/quotations/:id/suggestions ───────────────────────────────────────
// TASK 39: Returns product recommendations for a quote
// Shows margin impact, priority ranking, and promotion flags
async function getSuggestionsHandler(req, res) {
  const quoteId = parseId(req.params.id);
  if (!quoteId) {
    return res.status(400).json({ success: false, message: "Invalid quotation ID" });
  }

  try {
    const result = await getSuggestionsForQuote(quoteId);
    return res.status(200).json({
      success: true,
      quote_id: result.quote_id,
      suggestions: result.suggestions,
      message: result.message,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to get suggestions",
    });
  }
}

// ─── ADMIN: GET /api/admin/upsell-rules ────────────────────────────────────────
// Returns all upsell rules
async function getUpsellRulesHandler(req, res) {
  try {
    const rules = await getUpsellRules();
    return res.status(200).json({ success: true, rules });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch upsell rules",
    });
  }
}

// ─── ADMIN: POST /api/admin/upsell-rules ───────────────────────────────────────
// Create new upsell rule
async function createUpsellRuleHandler(req, res) {
  const { product_id, suggested_product_id, priority, promoted, min_margin } = req.body;

  if (!product_id || !suggested_product_id) {
    return res.status(400).json({
      success: false,
      message: "product_id and suggested_product_id are required",
    });
  }

  try {
    const rule = await createUpsellRule({
      product_id,
      suggested_product_id,
      priority,
      promoted,
      min_margin,
    });
    return res.status(201).json({
      success: true,
      message: "Upsell rule created",
      rule,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create upsell rule",
    });
  }
}

// ─── ADMIN: GET /api/admin/upsell-rules/:id ────────────────────────────────────
// Get single upsell rule
async function getUpsellRuleHandler(req, res) {
  const ruleId = parseId(req.params.id);
  if (!ruleId) {
    return res.status(400).json({ success: false, message: "Invalid rule ID" });
  }

  try {
    const rule = await getUpsellRuleById(ruleId);
    return res.status(200).json({ success: true, rule });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch upsell rule",
    });
  }
}

// ─── ADMIN: PUT /api/admin/upsell-rules/:id ────────────────────────────────────
// Update upsell rule
async function updateUpsellRuleHandler(req, res) {
  const ruleId = parseId(req.params.id);
  if (!ruleId) {
    return res.status(400).json({ success: false, message: "Invalid rule ID" });
  }

  const { priority, promoted, min_margin, active } = req.body;

  try {
    const rule = await updateUpsellRule(ruleId, {
      priority,
      promoted,
      min_margin,
      active,
    });
    return res.status(200).json({
      success: true,
      message: "Upsell rule updated",
      rule,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update upsell rule",
    });
  }
}

// ─── ADMIN: DELETE /api/admin/upsell-rules/:id ─────────────────────────────────
// Delete upsell rule
async function deleteUpsellRuleHandler(req, res) {
  const ruleId = parseId(req.params.id);
  if (!ruleId) {
    return res.status(400).json({ success: false, message: "Invalid rule ID" });
  }

  try {
    const result = await deleteUpsellRule(ruleId);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete upsell rule",
    });
  }
}

module.exports = {
  getSuggestionsHandler,
  getUpsellRulesHandler,
  createUpsellRuleHandler,
  getUpsellRuleHandler,
  updateUpsellRuleHandler,
  deleteUpsellRuleHandler,
};
