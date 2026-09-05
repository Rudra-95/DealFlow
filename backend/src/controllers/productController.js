const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
} = require("../services/productService");

// ─── GET /api/products ────────────────────────────────────────────────────────
async function getProducts(req, res) {
  try {
    const products = await getAllProducts();
    return res.status(200).json({ success: true, products });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch products",
    });
  }
}

// ─── GET /api/products/:id ────────────────────────────────────────────────────
async function getProduct(req, res) {
  // parseInt returns NaN for non-numeric strings; <= 0 rejects 0/-1
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  try {
    const product = await getProductById(id);
    return res.status(200).json({ success: true, product });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch product",
    });
  }
}

// ─── POST /api/products ───────────────────────────────────────────────────────
const VALID_BILLING_TYPES = ["ONE_TIME", "RECURRING"];

async function createProductHandler(req, res) {
  const { sku, name, category, description, price, cost, billing_type } = req.body;

  // 1. Required fields — use === undefined for price/cost so that 0 is accepted
  if (!sku || !name || !category || price === undefined || cost === undefined || !billing_type) {
    return res.status(400).json({
      success: false,
      message: "sku, name, category, price, cost and billing_type are required",
    });
  }

  // 2. billing_type enum guard (before the DB ENUM rejects it silently)
  if (!VALID_BILLING_TYPES.includes(billing_type)) {
    return res.status(400).json({
      success: false,
      message: `billing_type must be one of: ${VALID_BILLING_TYPES.join(", ")}`,
    });
  }

  // 3. NaN-safe numeric validation — Number("abc") = NaN, NaN < 0 is false (bug)
  const productPrice = Number(price);
  const productCost  = Number(cost);
  if (!Number.isFinite(productPrice) || !Number.isFinite(productCost) ||
      productPrice < 0 || productCost < 0) {
    return res.status(400).json({
      success: false,
      message: "price and cost must be valid non-negative numbers",
    });
  }

  try {
    const product = await createProduct({
      sku, name, category, description,
      price: productPrice, cost: productCost, billing_type,
    });
    return res.status(201).json({ success: true, message: "Product created", product });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create product",
    });
  }
}

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
async function updateProductHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const { name, category, description, price, cost, billing_type, active } = req.body;

  // billing_type enum guard (only when provided)
  if (billing_type !== undefined && !VALID_BILLING_TYPES.includes(billing_type)) {
    return res.status(400).json({
      success: false,
      message: `billing_type must be one of: ${VALID_BILLING_TYPES.join(", ")}`,
    });
  }

  // NaN-safe numeric validation (only when provided)
  if (price !== undefined) {
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ success: false, message: "price must be a valid non-negative number" });
    }
  }
  if (cost !== undefined) {
    const c = Number(cost);
    if (!Number.isFinite(c) || c < 0) {
      return res.status(400).json({ success: false, message: "cost must be a valid non-negative number" });
    }
  }

  try {
    const product = await updateProduct(id, { name, category, description, price, cost, billing_type, active });
    return res.status(200).json({ success: true, message: "Product updated", product });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update product",
    });
  }
}

module.exports = { getProducts, getProduct, createProductHandler, updateProductHandler };
