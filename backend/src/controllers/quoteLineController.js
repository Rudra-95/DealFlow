const {
  addQuoteLine,
  updateQuoteLine,
  deleteQuoteLine,
} = require("../services/quoteService");

// ─── Shared validation helpers ────────────────────────────────────────────────

function parseQuoteId(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ success: false, message: "Invalid quote ID" });
    return null;
  }
  return id;
}

function parseLineId(req, res) {
  const lineId = parseInt(req.params.lineId, 10);
  if (!Number.isInteger(lineId) || lineId <= 0) {
    res.status(400).json({ success: false, message: "Invalid line ID" });
    return null;
  }
  return lineId;
}

// ─── POST /api/quotes/:id/lines ───────────────────────────────────────────────
async function addLineHandler(req, res) {
  const quoteId = parseQuoteId(req, res);
  if (quoteId === null) return;

  const { product_id, quantity, discount_percent = 0 } = req.body;

  // Required fields
  if (!product_id || quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: "product_id and quantity are required",
    });
  }

  // NaN-safe quantity validation — must be a positive integer
  const qty = parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "quantity must be a positive integer (e.g. 1, 2, 5)",
    });
  }

  // NaN-safe discount validation
  const disc = Number(discount_percent);
  if (!Number.isFinite(disc) || disc < 0 || disc > 100) {
    return res.status(400).json({
      success: false,
      message: "discount_percent must be a number between 0 and 100",
    });
  }

  try {
    const quote = await addQuoteLine(quoteId, {
      product_id: parseInt(product_id, 10),
      quantity: qty,
      discount_percent: disc,
    });
    return res.status(201).json({ success: true, message: "Line added", quote });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to add quote line",
    });
  }
}

// ─── PUT /api/quotes/:id/lines/:lineId ───────────────────────────────────────
async function updateLineHandler(req, res) {
  const quoteId = parseQuoteId(req, res); if (quoteId === null) return;
  const lineId  = parseLineId(req, res);  if (lineId  === null) return;

  const { quantity, discount_percent } = req.body;

  // Validate quantity if provided
  if (quantity !== undefined) {
    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity must be a positive integer",
      });
    }
  }

  // Validate discount if provided
  if (discount_percent !== undefined) {
    const disc = Number(discount_percent);
    if (!Number.isFinite(disc) || disc < 0 || disc > 100) {
      return res.status(400).json({
        success: false,
        message: "discount_percent must be a number between 0 and 100",
      });
    }
  }

  try {
    const quote = await updateQuoteLine(quoteId, lineId, { quantity, discount_percent });
    return res.status(200).json({ success: true, message: "Line updated", quote });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update quote line",
    });
  }
}

// ─── DELETE /api/quotes/:id/lines/:lineId ─────────────────────────────────────
async function deleteLineHandler(req, res) {
  const quoteId = parseQuoteId(req, res); if (quoteId === null) return;
  const lineId  = parseLineId(req, res);  if (lineId  === null) return;

  try {
    const quote = await deleteQuoteLine(quoteId, lineId);
    return res.status(200).json({ success: true, message: "Line deleted", quote });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete quote line",
    });
  }
}

module.exports = { addLineHandler, updateLineHandler, deleteLineHandler };
