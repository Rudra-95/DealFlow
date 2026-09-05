const pool = require("../config/db");

const VALID_TIERS          = ["BRONZE", "SILVER", "GOLD"];
const VALID_APPROVAL_LEVELS = ["NONE", "SALES_MANAGER", "FINANCE"];

// ─── GET all rules (Admin UI) ─────────────────────────────────────────────────
async function getAllDiscountRules() {
  const [rows] = await pool.query(
    `SELECT id, customer_tier, category, max_discount_percent, approval_level
     FROM discount_rules
     ORDER BY customer_tier, category`
  );
  return rows;
}

// ─── Internal lookup — used by the discount engine ───────────────────────────
// Returns the single rule for a given tier + category combination.
// Returns null if no rule exists (treat as: no limit / no approval needed).
async function getDiscountRule(customerTier, category) {
  const [rows] = await pool.query(
    `SELECT id, customer_tier, category, max_discount_percent, approval_level
     FROM discount_rules
     WHERE customer_tier = ?
       AND category      = ?`,
    [customerTier, category]
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── PUT /api/admin/discount-rules ───────────────────────────────────────────
// Identified by customer_tier + category (UNIQUE constraint guarantees one row).
async function updateDiscountRule({ customer_tier, category, max_discount_percent, approval_level }) {
  // Validate
  if (!VALID_TIERS.includes(customer_tier)) {
    const err = new Error(`customer_tier must be one of: ${VALID_TIERS.join(", ")}`);
    err.status = 400;
    throw err;
  }
  if (!VALID_APPROVAL_LEVELS.includes(approval_level)) {
    const err = new Error(`approval_level must be one of: ${VALID_APPROVAL_LEVELS.join(", ")}`);
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(max_discount_percent) || max_discount_percent < 0 || max_discount_percent > 100) {
    const err = new Error("max_discount_percent must be a number between 0 and 100");
    err.status = 400;
    throw err;
  }

  // Check the rule exists
  const [existing] = await pool.query(
    `SELECT id FROM discount_rules
     WHERE customer_tier = ? AND category = ?`,
    [customer_tier, category]
  );
  if (existing.length === 0) {
    const err = new Error(`No rule found for tier '${customer_tier}' + category '${category}'`);
    err.status = 404;
    throw err;
  }

  await pool.query(
    `UPDATE discount_rules
     SET max_discount_percent = ?,
         approval_level       = ?
     WHERE customer_tier = ?
       AND category      = ?`,
    [max_discount_percent, approval_level, customer_tier, category]
  );

  // Return the updated rule
  return getDiscountRule(customer_tier, category);
}

module.exports = { getAllDiscountRules, getDiscountRule, updateDiscountRule };
