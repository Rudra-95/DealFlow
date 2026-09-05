const {
  getPendingApprovals,
  approveQuote,
  rejectQuote,
  requestRevision,
} = require("../services/approvalService");

// ─── GET /api/approvals/pending ───────────────────────────────────────────────
async function getPendingHandler(req, res) {
  try {
    const approvals = await getPendingApprovals(req.user.role);
    return res.status(200).json({ success: true, approvals });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch pending approvals",
    });
  }
}

// ─── POST /api/quotes/:id/approve ─────────────────────────────────────────────
async function approveHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid quote ID" });
  }

  try {
    const result = await approveQuote(id, req.user.id, req.user.role);
    return res.status(200).json({
      success: true,
      message: `Quote ${result.action.replace("_", " ").toLowerCase()}`,
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to approve quote",
    });
  }
}

// ─── POST /api/quotes/:id/reject ──────────────────────────────────────────────
async function rejectHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid quote ID" });
  }

  const { reason } = req.body;

  try {
    const result = await rejectQuote(id, req.user.id, req.user.role, reason);
    return res.status(200).json({
      success: true,
      message: "Quote rejected",
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to reject quote",
    });
  }
}

// ─── POST /api/quotes/:id/revision ────────────────────────────────────────────
async function revisionHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid quote ID" });
  }

  const { reason } = req.body;

  try {
    const result = await requestRevision(id, req.user.id, reason);
    return res.status(200).json({
      success: true,
      message: "Revision requested — quote returned to DRAFT",
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to request revision",
    });
  }
}

module.exports = { getPendingHandler, approveHandler, rejectHandler, revisionHandler };
