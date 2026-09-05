const express           = require("express");
const router            = express.Router({ mergeParams: true }); // inherits :id from parent
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles    = require("../middleware/roleMiddleware");
const {
  addLineHandler,
  updateLineHandler,
  deleteLineHandler,
} = require("../controllers/quoteLineController");

// All line endpoints require authentication.
// CUSTOMER doesn't touch quotes directly (they use /api/customer/quotation).
const canWrite = [authenticateToken, authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER")];

// POST   /api/quotes/:id/lines
router.post("/",            canWrite, addLineHandler);

// PUT    /api/quotes/:id/lines/:lineId
router.put("/:lineId",      canWrite, updateLineHandler);

// DELETE /api/quotes/:id/lines/:lineId
router.delete("/:lineId",   canWrite, deleteLineHandler);

module.exports = router;
