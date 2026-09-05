const pool = require("../config/db");

const VALID_BILLING_TYPES = ["ONE_TIME", "RECURRING"];

// ─── GET all active products ──────────────────────────────────────────────────
// cost is intentionally omitted — margin is calculated server-side
async function getAllProducts() {
  const [rows] = await pool.query(
    `SELECT id, sku, name, category, description, price, billing_type, active
     FROM products
     WHERE active = TRUE
     ORDER BY name`
  );
  return rows;
}

// ─── GET one product by ID ────────────────────────────────────────────────────
async function getProductById(id) {
  const [rows] = await pool.query(
    `SELECT id, sku, name, category, description, price, billing_type, active
     FROM products
     WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

// ─── GET product WITH cost (internal only — for margin calculations) ──────────
async function getProductWithCost(id) {
  const [rows] = await pool.query(
    `SELECT id, sku, name, category, description, price, cost, billing_type, active
     FROM products
     WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

// ─── CREATE product (Admin only) ──────────────────────────────────────────────
async function createProduct({ sku, name, category, description, price, cost, billing_type }) {
  // Validate billing_type
  if (!VALID_BILLING_TYPES.includes(billing_type)) {
    const err = new Error(`billing_type must be one of: ${VALID_BILLING_TYPES.join(", ")}`);
    err.status = 400;
    throw err;
  }

  // Check duplicate SKU
  const [existing] = await pool.query(
    "SELECT id FROM products WHERE sku = ?",
    [sku]
  );
  if (existing.length > 0) {
    const err = new Error(`A product with SKU '${sku}' already exists`);
    err.status = 409;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO products (sku, name, category, description, price, cost, billing_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sku, name, category, description ?? null, price, cost, billing_type]
  );

  return getProductById(result.insertId);
}

// ─── UPDATE product (Admin only) ──────────────────────────────────────────────
async function updateProduct(id, { name, category, description, price, cost, billing_type, active }) {
  // Confirm product exists first
  await getProductById(id);

  if (billing_type !== undefined && !VALID_BILLING_TYPES.includes(billing_type)) {
    const err = new Error(`billing_type must be one of: ${VALID_BILLING_TYPES.join(", ")}`);
    err.status = 400;
    throw err;
  }

  // Build update using only the fields that were provided
  await pool.query(
    `UPDATE products
     SET
       name         = COALESCE(?, name),
       category     = COALESCE(?, category),
       description  = COALESCE(?, description),
       price        = COALESCE(?, price),
       cost         = COALESCE(?, cost),
       billing_type = COALESCE(?, billing_type),
       active       = COALESCE(?, active)
     WHERE id = ?`,
    [
      name         ?? null,
      category     ?? null,
      description  ?? null,
      price        ?? null,
      cost         ?? null,
      billing_type ?? null,
      active       ?? null,
      id,
    ]
  );

  return getProductById(id);
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductWithCost,
  createProduct,
  updateProduct,
};
