/**
 * discountService.js — Phase 5: Discount Governance
 *
 * Responsibilities:
 *   - Look up the configured discount ceiling for a (tier, category) pair
 *   - Evaluate one line: actual vs. allowed → violation + excess
 *   - Aggregate all line excesses into a blended risk score
 *   - Persist risk_score on the quote after every line change
 *
 * NOTE: discount_rules already stores the combined (customer_tier, category)
 * ceiling in a single row. There is no separate "customer limit" table, so
 * the rule's max_discount_percent IS the effective limit — no Math.min()
 * across two separate tables is required.
 */

const pool = require("../config/db");
const { getDiscountRule } = require("./discountRuleService");

// ─── Task 17 — Effective discount limit ──────────────────────────────────────

/**
 * Returns the maximum allowed discount % for a given customer tier + product category.
 * Falls back to 100 (unrestricted) if no rule is configured for this combination.
 */
async function getEffectiveLimit(customerTier, category) {
  const rule = await getDiscountRule(customerTier, category);
  return rule ? Number(rule.max_discount_percent) : 100;
}

// ─── Task 18 — Line-level violation detection ─────────────────────────────────

/**
 * Evaluates one quote line against its configured limit.
 *
 * Returns:
 *   customerTier    — e.g. "GOLD"
 *   category        — e.g. "Service"
 *   allowedDiscount — the ceiling from discount_rules
 *   actualDiscount  — what the sales rep entered
 *   violation       — true when actual > allowed
 *   excess          — (actual - allowed) when violated, else 0
 */
async function checkLineDiscount(customerTier, category, actualDiscount) {
  const allowed   = await getEffectiveLimit(customerTier, category);
  const violation = actualDiscount > allowed;
  const excess    = violation
    ? parseFloat((actualDiscount - allowed).toFixed(4))
    : 0;

  return {
    customerTier,
    category,
    allowedDiscount: allowed,
    actualDiscount,
    violation,
    excess,
  };
}

// ─── Task 19 — Blended risk score ────────────────────────────────────────────

/**
 * Pure function — no I/O.
 * Sums the excess across ALL lines so that several small violations
 * accumulate rather than each hiding behind the worst single line.
 *
 * Example:
 *   line 1 excess = 0   (no violation)
 *   line 2 excess = 8   (18% actual, 10% allowed)
 *   blended risk  = 8
 *
 * Example (multiple small violations):
 *   line 1 +2, line 2 +3, line 3 +2 → blended = 7
 */
function calculateBlendedRisk(lineResults) {
  const total = lineResults.reduce((sum, r) => sum + r.excess, 0);
  return parseFloat(total.toFixed(4));
}

// ─── Full quote analysis (reads + writes) ─────────────────────────────────────

/**
 * analyzeQuoteDiscounts(quoteId)
 *
 * 1. Fetches customer tier + every quote line (with product category) in one query.
 * 2. Runs checkLineDiscount for each line independently.
 * 3. Calculates the blended risk score.
 * 4. Persists the score to quotes.risk_score.
 * 5. Returns the full analysis so the controller can expose it.
 *
 * Called AFTER the transaction that inserts/updates/deletes a line commits,
 * so the DB already contains the final line state when this runs.
 */
async function analyzeQuoteDiscounts(quoteId) {
  // One JOIN to get everything needed for the risk calculation
  const [rows] = await pool.query(
    `SELECT
       ql.id             AS line_id,
       ql.discount_percent,
       p.category        AS product_category,
       c.tier            AS customer_tier
     FROM quotes q
     JOIN customers  c  ON c.id = q.customer_id
     JOIN quote_lines ql ON ql.quote_id = q.id
     JOIN products   p  ON p.id = ql.product_id
     WHERE q.id = ?
     ORDER BY ql.id`,
    [quoteId]
  );

  // Empty quote → risk is 0
  if (rows.length === 0) {
    await pool.query("UPDATE quotes SET risk_score = 0 WHERE id = ?", [quoteId]);
    return { lineResults: [], riskScore: 0 };
  }

  // Evaluate every line independently (Task 18)
  const lineResults = [];
  for (const row of rows) {
    const result = await checkLineDiscount(
      row.customer_tier,
      row.product_category,
      Number(row.discount_percent)
    );
    result.line_id = row.line_id; // attach for traceability
    lineResults.push(result);
  }

  // Aggregate into blended score (Task 19)
  const riskScore = calculateBlendedRisk(lineResults);

  // Persist — Phase 6 will read this for approval routing
  await pool.query("UPDATE quotes SET risk_score = ? WHERE id = ?", [riskScore, quoteId]);

  return { lineResults, riskScore };
}

module.exports = {
  getEffectiveLimit,
  checkLineDiscount,
  calculateBlendedRisk,
  analyzeQuoteDiscounts,
};
