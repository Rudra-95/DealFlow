const pool = require("../config/db");
const { getQuoteById } = require("./quoteService");

// ─────────────────────────────────────────────────────────────────────────────
// TASK 39 — Get Upsell/Cross-Sell Suggestions for a Quote
// ─────────────────────────────────────────────────────────────────────────────
// Returns rule-based product recommendations with:
// - Margin impact (marginDelta)
// - Priority ranking
// - Promotion flag
// - Minimum margin validation
//
async function getSuggestionsForQuote(quoteId) {
  // Step 1: Get quote with lines
  const quote = await getQuoteById(quoteId);

  if (quote.lines.length === 0) {
    return {
      quote_id: quoteId,
      suggestions: [],
      message: "Quote has no line items",
    };
  }

  // Step 2: Collect all product IDs currently in the quote
  const existingProductIds = quote.lines.map(line => line.product_id);

  // Step 3: Find all matching upsell rules for products in the quote
  const [ruleRows] = await pool.query(
    `SELECT
       ur.id                    AS rule_id,
       ur.product_id,
       ur.suggested_product_id,
       ur.priority,
       ur.promoted,
       ur.min_margin,
       p.id                     AS suggested_id,
       p.sku                    AS suggested_sku,
       p.name                   AS suggested_name,
       p.category               AS suggested_category,
       p.description            AS suggested_description,
       p.price                  AS suggested_price,
       p.cost                   AS suggested_cost,
       p.billing_type           AS suggested_billing_type,
       base.name                AS base_product_name
     FROM upsell_rules ur
     JOIN products p    ON p.id = ur.suggested_product_id
     JOIN products base ON base.id = ur.product_id
     WHERE ur.product_id IN (?)
       AND ur.active = TRUE
       AND p.active = TRUE
       AND ur.suggested_product_id NOT IN (?)
     ORDER BY ur.priority ASC, ur.promoted DESC`,
    [existingProductIds, existingProductIds]
  );

  if (ruleRows.length === 0) {
    return {
      quote_id: quoteId,
      suggestions: [],
      message: "No recommendations available for products in this quote",
    };
  }

  // Step 4: Calculate margin delta for each suggestion and apply min_margin filter
  const suggestions = [];
  const seen = new Set(); // Prevent duplicate suggestions

  for (const rule of ruleRows) {
    // Skip if already suggested (a product might match multiple rules)
    if (seen.has(rule.suggested_product_id)) continue;
    seen.add(rule.suggested_product_id);

    // Calculate margin delta (assuming quantity = 1 for recommendation)
    const suggestedPrice = Number(rule.suggested_price);
    const suggestedCost = Number(rule.suggested_cost);
    const marginDelta = parseFloat((suggestedPrice - suggestedCost).toFixed(2));

    // Apply minimum margin filter
    const minMargin = Number(rule.min_margin);
    if (marginDelta < minMargin) {
      continue; // Skip this suggestion — doesn't meet margin requirement
    }

    suggestions.push({
      product_id: rule.suggested_product_id,
      product_sku: rule.suggested_sku,
      product_name: rule.suggested_name,
      product_category: rule.suggested_category,
      product_description: rule.suggested_description,
      price: suggestedPrice,
      billing_type: rule.suggested_billing_type,
      marginDelta,
      promoted: Boolean(rule.promoted),
      priority: rule.priority,
      base_product: rule.base_product_name,
      reason: `Recommended with ${rule.base_product_name}`,
    });
  }

  return {
    quote_id: quoteId,
    suggestions,
    message: suggestions.length > 0
      ? `Found ${suggestions.length} recommendation(s)`
      : "No recommendations meet the minimum margin requirement",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Get All Upsell Rules
// ─────────────────────────────────────────────────────────────────────────────
async function getUpsellRules() {
  const [rows] = await pool.query(
    `SELECT
       ur.id,
       ur.product_id,
       p1.name          AS product_name,
       p1.sku           AS product_sku,
       ur.suggested_product_id,
       p2.name          AS suggested_product_name,
       p2.sku           AS suggested_product_sku,
       ur.priority,
       ur.promoted,
       ur.min_margin,
       ur.active,
       ur.created_at
     FROM upsell_rules ur
     JOIN products p1 ON p1.id = ur.product_id
     JOIN products p2 ON p2.id = ur.suggested_product_id
     ORDER BY ur.priority ASC, ur.product_id`
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Create Upsell Rule
// ─────────────────────────────────────────────────────────────────────────────
async function createUpsellRule({ product_id, suggested_product_id, priority = 1, promoted = false, min_margin = 0 }) {
  // Validation: can't suggest a product to itself
  if (product_id === suggested_product_id) {
    const err = new Error("Cannot create rule suggesting a product to itself");
    err.status = 400;
    throw err;
  }

  // Validation: both products must exist and be active
  const [productRows] = await pool.query(
    "SELECT id, name, active FROM products WHERE id IN (?, ?)",
    [product_id, suggested_product_id]
  );

  if (productRows.length !== 2) {
    const err = new Error("One or both products not found");
    err.status = 404;
    throw err;
  }

  const inactiveProducts = productRows.filter(p => !p.active);
  if (inactiveProducts.length > 0) {
    const err = new Error(`Cannot create rule with inactive products: ${inactiveProducts.map(p => p.name).join(", ")}`);
    err.status = 400;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO upsell_rules
       (product_id, suggested_product_id, priority, promoted, min_margin)
     VALUES (?, ?, ?, ?, ?)`,
    [product_id, suggested_product_id, priority, promoted, min_margin]
  );

  return getUpsellRuleById(result.insertId);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Get Single Upsell Rule
// ─────────────────────────────────────────────────────────────────────────────
async function getUpsellRuleById(ruleId) {
  const [rows] = await pool.query(
    `SELECT
       ur.id,
       ur.product_id,
       p1.name          AS product_name,
       p1.sku           AS product_sku,
       ur.suggested_product_id,
       p2.name          AS suggested_product_name,
       p2.sku           AS suggested_product_sku,
       ur.priority,
       ur.promoted,
       ur.min_margin,
       ur.active,
       ur.created_at
     FROM upsell_rules ur
     JOIN products p1 ON p1.id = ur.product_id
     JOIN products p2 ON p2.id = ur.suggested_product_id
     WHERE ur.id = ?`,
    [ruleId]
  );

  if (rows.length === 0) {
    const err = new Error("Upsell rule not found");
    err.status = 404;
    throw err;
  }

  return rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Update Upsell Rule
// ─────────────────────────────────────────────────────────────────────────────
async function updateUpsellRule(ruleId, updates) {
  const { priority, promoted, min_margin, active } = updates;

  // Verify rule exists
  await getUpsellRuleById(ruleId);

  const fields = [];
  const values = [];

  if (priority !== undefined) {
    fields.push("priority = ?");
    values.push(priority);
  }
  if (promoted !== undefined) {
    fields.push("promoted = ?");
    values.push(promoted);
  }
  if (min_margin !== undefined) {
    fields.push("min_margin = ?");
    values.push(min_margin);
  }
  if (active !== undefined) {
    fields.push("active = ?");
    values.push(active);
  }

  if (fields.length === 0) {
    return getUpsellRuleById(ruleId);
  }

  values.push(ruleId);

  await pool.query(
    `UPDATE upsell_rules SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return getUpsellRuleById(ruleId);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Delete Upsell Rule
// ─────────────────────────────────────────────────────────────────────────────
async function deleteUpsellRule(ruleId) {
  const rule = await getUpsellRuleById(ruleId);

  await pool.query("DELETE FROM upsell_rules WHERE id = ?", [ruleId]);

  return {
    message: "Upsell rule deleted",
    deleted_rule: rule,
  };
}

module.exports = {
  getSuggestionsForQuote,
  getUpsellRules,
  createUpsellRule,
  getUpsellRuleById,
  updateUpsellRule,
  deleteUpsellRule,
};
