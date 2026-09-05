const pool = require("../config/db");

// ─── Get all subscription plans ───────────────────────────────────────────────
async function getSubscriptionPlans() {
  const [rows] = await pool.query(
    `SELECT id, name, billing_interval, price, proration_enabled
     FROM subscription_plans
     ORDER BY
       FIELD(billing_interval, 'MONTHLY', 'QUARTERLY', 'YEARLY')`
  );
  return rows;
}

// ─── Get a single plan by ID ──────────────────────────────────────────────────
// Used by billing logic to compute recurring amounts and proration.
async function getSubscriptionPlanById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, billing_interval, price, proration_enabled
     FROM subscription_plans
     WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error("Subscription plan not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

module.exports = { getSubscriptionPlans, getSubscriptionPlanById };
