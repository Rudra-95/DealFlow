const {
  getStalledDeals,
  getDiscountAnomalies,
  getAllDealHealthIssues,
  checkQuoteHealth,
} = require("../services/dealHealthService");

// ─── Helper — parse and validate :id param ────────────────────────────────────
function parseId(raw) {
  const id = parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ─── GET /api/deal-health ───────────────────────────────────────────────────
// Returns all deal health issues (stalled deals + discount anomalies)
async function getAllIssuesHandler(req, res) {
  try {
    const issues = await getAllDealHealthIssues();
    return res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch deal health issues",
    });
  }
}

// ─── GET /api/deal-health/stalled ───────────────────────────────────────────
// TASK 41: Returns only stalled deals (> 3 days inactive)
async function getStalledDealsHandler(req, res) {
  try {
    const stalledDeals = await getStalledDeals();
    return res.status(200).json({
      success: true,
      count: stalledDeals.length,
      stalled_deals: stalledDeals,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch stalled deals",
    });
  }
}

// ─── GET /api/deal-health/anomalies ─────────────────────────────────────────
// TASK 42: Returns discount anomalies (current > historical avg + threshold)
async function getAnomaliesHandler(req, res) {
  try {
    const anomalies = await getDiscountAnomalies();
    return res.status(200).json({
      success: true,
      count: anomalies.length,
      anomalies,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch discount anomalies",
    });
  }
}

// ─── GET /api/deal-health/:id ───────────────────────────────────────────────
// Check health of a specific quote
async function checkQuoteHealthHandler(req, res) {
  const quoteId = parseId(req.params.id);
  if (!quoteId) {
    return res.status(400).json({ success: false, message: "Invalid quote ID" });
  }

  try {
    const health = await checkQuoteHealth(quoteId);
    return res.status(200).json({
      success: true,
      data: health,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to check quote health",
    });
  }
}

module.exports = {
  getAllIssuesHandler,
  getStalledDealsHandler,
  getAnomaliesHandler,
  checkQuoteHealthHandler,
};
