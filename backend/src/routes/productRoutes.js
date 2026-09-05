const express         = require("express");
const router          = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles  = require("../middleware/roleMiddleware");
const {
  getProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
} = require("../controllers/productController");

// Read — all internal roles can view the product catalog
const canRead = [authenticateToken, authorizeRoles("ADMIN", "SALES_REP", "SALES_MANAGER", "FINANCE")];
// Write — Admin only (soft-delete via active=false, no DELETE endpoint per contract)
const adminOnly = [authenticateToken, authorizeRoles("ADMIN")];

// GET /api/products
router.get("/", canRead, getProducts);

// GET /api/products/:id
router.get("/:id", canRead, getProduct);

// POST /api/products
router.post("/", adminOnly, createProductHandler);

// PUT /api/products/:id
router.put("/:id", adminOnly, updateProductHandler);

module.exports = router;
