const {
  getInvoices,
  getInvoiceById,
  processPayment,
  cancelInvoice,
} = require("../services/invoiceService");

// ─── Helper — parse and validate :id param ────────────────────────────────────
function parseId(raw) {
  const id = parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ─── GET /api/invoices ─────────────────────────────────────────────────────────
// Returns invoices visible to the authenticated user based on their role.
async function getInvoicesHandler(req, res) {
  try {
    const invoices = await getInvoices(req.user.id, req.user.role);
    return res.status(200).json({ success: true, invoices });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch invoices",
    });
  }
}

// ─── GET /api/invoices/:id ─────────────────────────────────────────────────────
async function getInvoiceHandler(req, res) {
  const invoiceId = parseId(req.params.id);
  if (!invoiceId) {
    return res.status(400).json({ success: false, message: "Invalid invoice ID" });
  }

  try {
    const invoice = await getInvoiceById(invoiceId);
    return res.status(200).json({ success: true, invoice });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch invoice",
    });
  }
}

// ─── POST /api/invoices/:id/payment ────────────────────────────────────────────
// Process payment for an invoice.
//
// Body:
// {
//   "amount": 100000,
//   "payment_method": "CREDIT_CARD"
// }
async function processPaymentHandler(req, res) {
  const invoiceId = parseId(req.params.id);
  if (!invoiceId) {
    return res.status(400).json({ success: false, message: "Invalid invoice ID" });
  }

  const { amount, payment_method } = req.body;
  if (!amount) {
    return res.status(400).json({
      success: false,
      message: "amount is required",
    });
  }

  try {
    const result = await processPayment(invoiceId, { amount, payment_method });
    return res.status(200).json({
      success: true,
      message: result.message,
      invoice: result.invoice,
      payment_id: result.payment_id,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to process payment",
    });
  }
}

// ─── POST /api/invoices/:id/cancel ─────────────────────────────────────────────
// Cancel an unpaid invoice (admin operation).
async function cancelInvoiceHandler(req, res) {
  const invoiceId = parseId(req.params.id);
  if (!invoiceId) {
    return res.status(400).json({ success: false, message: "Invalid invoice ID" });
  }

  try {
    const invoice = await cancelInvoice(invoiceId);
    return res.status(200).json({
      success: true,
      message: "Invoice cancelled",
      invoice,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to cancel invoice",
    });
  }
}

module.exports = {
  getInvoicesHandler,
  getInvoiceHandler,
  processPaymentHandler,
  cancelInvoiceHandler,
};
