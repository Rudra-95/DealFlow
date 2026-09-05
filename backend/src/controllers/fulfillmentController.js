const {
  getFulfillmentSuggestion,
  acceptSuggestedFulfillment,
  manualOverrideFulfillment,
  getFulfillmentAllocations,
} = require("../services/fulfillmentService");

// ─── Helper — parse and validate :id param ────────────────────────────────────
function parseId(raw) {
  const id = parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ─── GET /api/quotations/:id/fulfillment-suggestion ───────────────────────────
// Returns the automatic warehouse split for an approved quote.
// Frontend uses this to display the suggested allocation before the user acts.
async function getSuggestionHandler(req, res) {
  const quoteId = parseId(req.params.id);
  if (!quoteId) {
    return res.status(400).json({ success: false, message: "Invalid quotation ID" });
  }

  try {
    const suggestion = await getFulfillmentSuggestion(quoteId);
    return res.status(200).json({ success: true, data: suggestion });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to generate fulfillment suggestion",
    });
  }
}

// ─── GET /api/quotations/:id/fulfillment ──────────────────────────────────────
// Returns already-committed fulfillment allocations (after accept/override).
async function getAllocationsHandler(req, res) {
  const quoteId = parseId(req.params.id);
  if (!quoteId) {
    return res.status(400).json({ success: false, message: "Invalid quotation ID" });
  }

  try {
    const allocations = await getFulfillmentAllocations(quoteId);
    return res.status(200).json({ success: true, data: { quote_id: quoteId, allocations } });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch fulfillment allocations",
    });
  }
}

// ─── POST /api/quotations/:id/fulfillment/accept ──────────────────────────────
// User clicks "Accept Suggested Split".
// Re-fetches current stock before committing — never trusts a stale suggestion.
async function acceptSplitHandler(req, res) {
  const quoteId = parseId(req.params.id);
  if (!quoteId) {
    return res.status(400).json({ success: false, message: "Invalid quotation ID" });
  }

  try {
    const result = await acceptSuggestedFulfillment(quoteId);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to accept fulfillment split",
    });
  }
}

// ─── POST /api/quotations/:id/fulfillment/override ────────────────────────────
// User provides a custom warehouse split instead of the automatic suggestion.
//
// Expected body:
// {
//   "allocations": [
//     { "quote_line_id": 3, "warehouse_id": 1, "quantity": 2 },
//     { "quote_line_id": 3, "warehouse_id": 2, "quantity": 3 }
//   ]
// }
async function manualOverrideHandler(req, res) {
  const quoteId = parseId(req.params.id);
  if (!quoteId) {
    return res.status(400).json({ success: false, message: "Invalid quotation ID" });
  }

  const { allocations } = req.body;
  if (!allocations) {
    return res.status(400).json({
      success: false,
      message: "Request body must include an allocations array",
    });
  }

  try {
    const result = await manualOverrideFulfillment(quoteId, allocations);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to apply manual fulfillment override",
    });
  }
}

module.exports = {
  getSuggestionHandler,
  getAllocationsHandler,
  acceptSplitHandler,
  manualOverrideHandler,
};
