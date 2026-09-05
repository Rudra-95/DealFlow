const {
  getCustomerQuotation,
  submitNegotiation,
  confirmCustomerQuotation,
} = require("../services/customerQuotationService");

// ─── GET /api/customer/quotation ───────────────────────────────────────────────
// TASK 35 — Customer views their quotation
// Returns ONLY customer-safe data (no cost, margin, risk_score)
async function getQuotationHandler(req, res) {
  try {
    // req.customer populated by customerAuthMiddleware
    const quotation = await getCustomerQuotation(req.customer.id, req.customer.quote_id);
    return res.status(200).json({ success: true, quotation });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch quotation",
    });
  }
}

// ─── POST /api/customer/quotation/negotiate ────────────────────────────────────
// TASK 36 — Customer submits negotiation request
//
// Body:
// {
//   "line_id": 35,
//   "request_type": "COUNTER_DISCOUNT",
//   "requested_discount": 12,
//   "comment": "Can you offer a better price?"
// }
//
// Valid request_types: COMMENT, CHANGE_REQUEST, COUNTER_DISCOUNT
async function negotiateHandler(req, res) {
  const {
    line_id,
    request_type,
    requested_quantity,
    requested_unit_price,
    requested_discount,
    comment,
  } = req.body;

  if (!request_type) {
    return res.status(400).json({
      success: false,
      message: "request_type is required (COMMENT, CHANGE_REQUEST, or COUNTER_DISCOUNT)",
    });
  }

  try {
    const result = await submitNegotiation(req.customer.id, req.customer.quote_id, {
      line_id,
      request_type,
      requested_quantity,
      requested_unit_price,
      requested_discount,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      negotiation: result.negotiation,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to submit negotiation",
    });
  }
}

// ─── POST /api/customer/quotation/confirm ──────────────────────────────────────
// Customer confirms the quotation (accepts it)
// Only allowed if quote is APPROVED
async function confirmHandler(req, res) {
  try {
    const result = await confirmCustomerQuotation(req.customer.id, req.customer.quote_id);

    return res.status(200).json({
      success: true,
      message: result.message,
      quote_id: result.quote_id,
      status: result.status,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to confirm quotation",
    });
  }
}

module.exports = {
  getQuotationHandler,
  negotiateHandler,
  confirmHandler,
};
