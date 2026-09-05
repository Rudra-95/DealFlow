const {
  getDashboardSummary,
  getRecentActivity,
} = require("../services/dashboardService");

// ─── GET /api/dashboard ─────────────────────────────────────────────────────
// TASK 40: Returns dashboard summary statistics
// - total_quotes
// - pending_approvals
// - approved_quotes
// - orders
// - revenue
async function getDashboardHandler(req, res) {
  try {
    const summary = await getDashboardSummary();
    const recentActivity = await getRecentActivity(10);

    return res.status(200).json({
      success: true,
      data: {
        summary,
        recent_activity: recentActivity,
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch dashboard data",
    });
  }
}

module.exports = {
  getDashboardHandler,
};
