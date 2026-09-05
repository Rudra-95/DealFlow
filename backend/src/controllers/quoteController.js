const {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
  submitQuote,
} = require("../services/quoteService");

// ─── POST /api/quotes ─────────────────────────────────────────────────────────
async function createQuoteHandler(req, res) {
  const { customer_id } = req.body;

  if (!customer_id) {
    return res.status(400).json({ success: false, message: "customer_id is required" });
  }

  try {
    // sales_rep_id always comes from the verified JWT — never from the request body
    const quote = await createQuote(req.user.id, customer_id);
    return res.status(201).json({ success: true, message: "Quote created", quote });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create quote",
    });
  }
}

// ─── GET /api/quotes ──────────────────────────────────────────────────────────
async function getQuotesHandler(req, res) {
  try {
    const quotes = await getQuotes(req.user.id, req.user.role);
    return res.status(200).json({ success: true, quotes });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch quotes",
    });
  }
}

// ─── GET /api/quotes/:id ──────────────────────────────────────────────────────
async function getQuoteHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid quote ID" });
  }

  try {
    const quote = await getQuoteById(id);

    // Ownership: SALES_REP may only view their own quotes
    if (req.user.role === "SALES_REP" && quote.sales_rep.id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, quote });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch quote",
    });
  }
}

// ─── PUT /api/quotes/:id ──────────────────────────────────────────────────────
// Only metadata fields (valid_until). Financial totals are always computed from lines.
async function updateQuoteHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid quote ID" });
  }

  const { valid_until } = req.body;

  try {
    const quote = await updateQuote(id, req.user.id, req.user.role, { valid_until });
    return res.status(200).json({ success: true, message: "Quote updated", quote });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update quote",
    });
  }
}

// ─── POST /api/quotes/:id/submit ────────────────────────────────────────────────
async function submitQuoteHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid quote ID" });
  }

  try {
    const result = await submitQuote(id, req.user.id, req.user.role);
    return res.status(200).json({
      success: true,
      message: `Quote submitted — status: ${result.quote.status}`,
      quote:      result.quote,
      routing:    result.routing,
      risk_score: result.risk_score,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to submit quote",
    });
  }
}

module.exports = { createQuoteHandler, getQuotesHandler, getQuoteHandler, updateQuoteHandler, submitQuoteHandler };
