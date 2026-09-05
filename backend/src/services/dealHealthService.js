const pool = require("../config/db");

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Constants
// ─────────────────────────────────────────────────────────────────────────────
const STALLED_THRESHOLD_DAYS = 3; // Task 41: > 3 days = stalled
const ANOMALY_THRESHOLD_PERCENTAGE = 5; // Task 42: historical avg + 5%

// ─────────────────────────────────────────────────────────────────────────────
// TASK 41 — Stalled Deal Detection
// ─────────────────────────────────────────────────────────────────────────────
// A quote is STALLED if inactive for > 3 days
// Inactivity is measured from the quote's updated_at timestamp
//
async function getStalledDeals() {
  const [rows] = await pool.query(
    `SELECT
       q.id,
       q.status,
       q.grand_total,
       q.created_at,
       q.updated_at,
       DATEDIFF(NOW(), q.updated_at) AS days_inactive,
       c.id   AS customer_id,
       c.name AS customer_name,
       c.tier AS customer_tier,
       u.id   AS sales_rep_id,
       u.name AS sales_rep_name
     FROM quotes q
     JOIN customers c ON c.id = q.customer_id
     JOIN users u ON u.id = q.sales_rep_id
     WHERE q.status NOT IN ('CONFIRMED', 'COMPLETED', 'REJECTED', 'EXPIRED')
       AND DATEDIFF(NOW(), q.updated_at) > ?
     ORDER BY days_inactive DESC`,
    [STALLED_THRESHOLD_DAYS]
  );

  return rows.map(row => ({
    quote_id: row.id,
    status: row.status,
    grand_total: row.grand_total,
    days_inactive: row.days_inactive,
    stalled: true,
    last_activity: row.updated_at,
    customer: {
      id: row.customer_id,
      name: row.customer_name,
      tier: row.customer_tier,
    },
    sales_rep: {
      id: row.sales_rep_id,
      name: row.sales_rep_name,
    },
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 42 — Discount Anomaly Detection
// ─────────────────────────────────────────────────────────────────────────────
// Detects when a sales rep's current discount exceeds their historical average
// Formula: current_discount > (historical_average + threshold)
//
async function getDiscountAnomalies() {
  // Get all sales reps with their current quote discounts and historical averages
  const [rows] = await pool.query(
    `SELECT
       q.id                AS quote_id,
       q.sales_rep_id,
       u.name              AS sales_rep_name,
       q.discount_total,
       q.grand_total,
       q.subtotal,
       q.status,
       q.created_at,
       c.name              AS customer_name,
       -- Current discount percentage
       CASE 
         WHEN q.subtotal > 0 THEN (q.discount_total / q.subtotal * 100)
         ELSE 0
       END AS current_discount_percent,
       -- Historical average discount for this rep (excluding current quote)
       (SELECT AVG(
           CASE 
             WHEN qq.subtotal > 0 THEN (qq.discount_total / qq.subtotal * 100)
             ELSE 0
           END
         )
        FROM quotes qq
        WHERE qq.sales_rep_id = q.sales_rep_id
          AND qq.id != q.id
          AND qq.status NOT IN ('DRAFT', 'REJECTED', 'EXPIRED')
       ) AS historical_avg_discount
     FROM quotes q
     JOIN users u ON u.id = q.sales_rep_id
     JOIN customers c ON c.id = q.customer_id
     WHERE q.status NOT IN ('REJECTED', 'EXPIRED', 'COMPLETED')
       AND q.discount_total > 0
     HAVING historical_avg_discount IS NOT NULL
        AND current_discount_percent > (historical_avg_discount + ?)
     ORDER BY (current_discount_percent - historical_avg_discount) DESC`,
    [ANOMALY_THRESHOLD_PERCENTAGE]
  );

  return rows.map(row => ({
    quote_id: row.quote_id,
    sales_rep_id: row.sales_rep_id,
    sales_rep_name: row.sales_rep_name,
    customer_name: row.customer_name,
    status: row.status,
    current_discount: parseFloat(row.current_discount_percent.toFixed(2)),
    historical_average: parseFloat(row.historical_avg_discount.toFixed(2)),
    threshold: ANOMALY_THRESHOLD_PERCENTAGE,
    anomaly_limit: parseFloat((row.historical_avg_discount + ANOMALY_THRESHOLD_PERCENTAGE).toFixed(2)),
    anomaly: true,
    deviation: parseFloat((row.current_discount_percent - row.historical_avg_discount).toFixed(2)),
    grand_total: row.grand_total,
    created_at: row.created_at,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Get All Deal Health Issues
// ─────────────────────────────────────────────────────────────────────────────
// Combined view of stalled deals and discount anomalies
async function getAllDealHealthIssues() {
  const [stalledDeals, discountAnomalies] = await Promise.all([
    getStalledDeals(),
    getDiscountAnomalies(),
  ]);

  return {
    stalled_deals: stalledDeals,
    stalled_count: stalledDeals.length,
    discount_anomalies: discountAnomalies,
    anomaly_count: discountAnomalies.length,
    total_issues: stalledDeals.length + discountAnomalies.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check Single Quote Health
// ─────────────────────────────────────────────────────────────────────────────
async function checkQuoteHealth(quoteId) {
  // Check if stalled
  const [stalledRows] = await pool.query(
    `SELECT
       q.id,
       DATEDIFF(NOW(), q.updated_at) AS days_inactive
     FROM quotes q
     WHERE q.id = ?
       AND q.status NOT IN ('CONFIRMED', 'COMPLETED', 'REJECTED', 'EXPIRED')
       AND DATEDIFF(NOW(), q.updated_at) > ?`,
    [quoteId, STALLED_THRESHOLD_DAYS]
  );

  const is_stalled = stalledRows.length > 0;
  const days_inactive = stalledRows.length > 0 ? stalledRows[0].days_inactive : null;

  // Check for discount anomaly
  const [anomalyRows] = await pool.query(
    `SELECT
       q.id,
       q.discount_total,
       q.subtotal,
       CASE 
         WHEN q.subtotal > 0 THEN (q.discount_total / q.subtotal * 100)
         ELSE 0
       END AS current_discount_percent,
       (SELECT AVG(
           CASE 
             WHEN qq.subtotal > 0 THEN (qq.discount_total / qq.subtotal * 100)
             ELSE 0
           END
         )
        FROM quotes qq
        WHERE qq.sales_rep_id = q.sales_rep_id
          AND qq.id != q.id
          AND qq.status NOT IN ('DRAFT', 'REJECTED', 'EXPIRED')
       ) AS historical_avg_discount
     FROM quotes q
     WHERE q.id = ?
       AND q.discount_total > 0`,
    [quoteId]
  );

  let has_discount_anomaly = false;
  let discount_details = null;

  if (anomalyRows.length > 0 && anomalyRows[0].historical_avg_discount !== null) {
    const row = anomalyRows[0];
    const current = parseFloat(row.current_discount_percent);
    const historical = parseFloat(row.historical_avg_discount);
    const limit = historical + ANOMALY_THRESHOLD_PERCENTAGE;

    has_discount_anomaly = current > limit;

    discount_details = {
      current_discount: parseFloat(current.toFixed(2)),
      historical_average: parseFloat(historical.toFixed(2)),
      threshold: ANOMALY_THRESHOLD_PERCENTAGE,
      anomaly_limit: parseFloat(limit.toFixed(2)),
      anomaly: has_discount_anomaly,
    };
  }

  return {
    quote_id: quoteId,
    is_stalled,
    days_inactive,
    stalled_threshold: STALLED_THRESHOLD_DAYS,
    has_discount_anomaly,
    discount_analysis: discount_details,
    health_status: is_stalled || has_discount_anomaly ? "NEEDS_ATTENTION" : "HEALTHY",
  };
}

module.exports = {
  getStalledDeals,
  getDiscountAnomalies,
  getAllDealHealthIssues,
  checkQuoteHealth,
};
