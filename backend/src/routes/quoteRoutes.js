const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const {
  createQuoteHandler,
  getQuotesHandler,
  getQuoteHandler,
  updateQuoteHandler,
  submitQuoteHandler,
  confirmQuoteHandler,
} = require("../controllers/quoteController");
const {
  approveHandler,
  rejectHandler,
  revisionHandler,
} = require("../controllers/approvalController");
const quoteLineRouter   = require("./quoteLineRoutes");

// Roles that can read quotes
const canRead  = [authenticateToken, authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER", "FINANCE")];
// Roles that can create/modify quotes
const canWrite = [authenticateToken, authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER")];

// ─── Quote routes ─────────────────────────────────────────────────────────────

// POST /api/quotes
router.post("/",      canWrite, createQuoteHandler);

// GET  /api/quotes
router.get("/",       canRead,  getQuotesHandler);

// GET  /api/quotes/:id
router.get("/:id",    canRead,  getQuoteHandler);

// PUT  /api/quotes/:id
router.put("/:id",    canWrite, updateQuoteHandler);

// POST /api/quotes/:id/submit (DRAFT → PENDING_MANAGER | APPROVED)
router.post("/:id/submit",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER"),
  submitQuoteHandler
);

// POST /api/quotes/:id/approve (SALES_MANAGER or FINANCE depending on current stage)
router.post("/:id/approve",
  authenticateToken,
  authorizeRoles("SALES_MANAGER", "FINANCE"),
  approveHandler
);

// POST /api/quotes/:id/reject
router.post("/:id/reject",
  authenticateToken,
  authorizeRoles("SALES_MANAGER", "FINANCE"),
  rejectHandler
);

// POST /api/quotes/:id/revision (SALES_MANAGER only — returns quote to DRAFT)
router.post("/:id/revision",
  authenticateToken,
  authorizeRoles("SALES_MANAGER"),
  revisionHandler
);

// POST /api/quotations/:id/confirm (Phase 8 Task 29 — APPROVED → CONFIRMED + billing)
router.post("/:id/confirm",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_MANAGER", "FINANCE"),
  confirmQuoteHandler
);

// ─── Nested: /api/quotes/:id/lines/** ────────────────────────────────────────
// The quoteLineRouter receives mergeParams:true so :id is available there too.
router.use("/:id/lines", quoteLineRouter);

module.exports = router;
