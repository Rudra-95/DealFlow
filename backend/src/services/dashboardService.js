const pool = require("../config/db");

// ─────────────────────────────────────────────────────────────────────────────
// TASK 40 — Dashboard Summary
// ─────────────────────────────────────────────────────────────────────────────
// Returns:
// - total_quotes: All quotes in the system
// - pending_approvals: Quotes waiting for approval (PENDING_MANAGER, PENDING_FINANCE)
// - approved_quotes: Quotes with APPROVED status
// - orders: Confirmed orders (CONFIRMED status)
// - revenue: Total from confirmed orders
//
async function getDashboardSummary() {
  // Total quotes
  const [totalRows] = await pool.query("SELECT COUNT(*) AS count FROM quotes");
  const total_quotes = totalRows[0].count;

  // Pending approvals (PENDING_MANAGER or PENDING_FINANCE)
  const [pendingRows] = await pool.query(
    `SELECT COUNT(*) AS count 
     FROM quotes 
     WHERE status IN ('PENDING_MANAGER', 'PENDING_FINANCE')`
  );
  const pending_approvals = pendingRows[0].count;

  // Approved quotes
  const [approvedRows] = await pool.query(
    "SELECT COUNT(*) AS count FROM quotes WHERE status = 'APPROVED'"
  );
  const approved_quotes = approvedRows[0].count;

  // Orders (CONFIRMED status)
  const [ordersRows] = await pool.query(
    "SELECT COUNT(*) AS count FROM quotes WHERE status = 'CONFIRMED'"
  );
  const orders = ordersRows[0].count;

  // Revenue (sum of grand_total for CONFIRMED orders)
  const [revenueRows] = await pool.query(
    `SELECT COALESCE(SUM(grand_total), 0) AS total 
     FROM quotes 
     WHERE status = 'CONFIRMED'`
  );
  const revenue = parseFloat(revenueRows[0].total);

  return {
    total_quotes,
    pending_approvals,
    approved_quotes,
    orders,
    revenue,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Recent Activity Summary
// ─────────────────────────────────────────────────────────────────────────────
// Additional dashboard data: recent quotes by status
async function getRecentActivity(limit = 10) {
  const [rows] = await pool.query(
    `SELECT
       q.id,
       q.status,
       q.grand_total,
       q.created_at,
       q.updated_at,
       c.name AS customer_name,
       u.name AS sales_rep_name
     FROM quotes q
     JOIN customers c ON c.id = q.customer_id
     JOIN users u ON u.id = q.sales_rep_id
     ORDER BY q.updated_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = {
  getDashboardSummary,
  getRecentActivity,
};
