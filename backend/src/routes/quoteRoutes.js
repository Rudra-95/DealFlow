const express           = require("express");
const router            = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const {
  createQuoteHandler,
  getQuotesHandler,
  getQuoteHandler,
  updateQuoteHandler,
} = require("../controllers/quoteController");
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

// ─── Nested: /api/quotes/:id/lines/** ────────────────────────────────────────
// The quoteLineRouter receives mergeParams:true so :id is available there too.
router.use("/:id/lines", quoteLineRouter);

module.exports = router;
