const pool = require("../config/db");

// ─── Get inventory for a product across all warehouses ────────────────────────
// Returns only warehouses that are active and have stock > 0.
// Used by the fulfillment engine to decide warehouse splits.
async function getProductInventory(productId) {
  // Sorted cheapest shipping first so fulfillment engine picks optimally
  const [rows] = await pool.query(
    `SELECT
       i.warehouse_id,
       w.name              AS warehouse_name,
       w.location,
       w.shipping_cost_weight,
       i.available_quantity
     FROM inventory i
     JOIN warehouses w ON w.id = i.warehouse_id
     WHERE i.product_id    = ?
       AND w.active        = TRUE
       AND i.available_quantity > 0
     ORDER BY w.shipping_cost_weight ASC`,
    [productId]
  );
  return rows;
}

// ─── Get stock of a specific product in a specific warehouse ──────────────────
async function getWarehouseInventory(warehouseId, productId) {
  const [rows] = await pool.query(
    `SELECT
       i.available_quantity,
       w.name              AS warehouse_name,
       w.shipping_cost_weight
     FROM inventory i
     JOIN warehouses w ON w.id = i.warehouse_id
     WHERE i.warehouse_id = ?
       AND i.product_id   = ?`,
    [warehouseId, productId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Get all warehouses that can partially or fully fulfil a quantity ─────────
// Returns warehouses sorted by shipping_cost_weight ascending so the
// fulfillment engine can greedily pick the cheapest source first.
async function getAvailableWarehouses(productId) {
  const [rows] = await pool.query(
    `SELECT
       w.id,
       w.name,
       w.location,
       w.shipping_cost_weight,
       i.available_quantity
     FROM inventory i
     JOIN warehouses w ON w.id = i.warehouse_id
     WHERE i.product_id       = ?
       AND w.active            = TRUE
       AND i.available_quantity > 0
     ORDER BY w.shipping_cost_weight ASC`,
    [productId]
  );
  return rows;
}

// ─── Deduct stock (called after fulfillment is accepted) ─────────────────────
async function deductInventory(warehouseId, productId, quantity) {
  await pool.query(
    `UPDATE inventory
     SET available_quantity = available_quantity - ?
     WHERE warehouse_id = ?
       AND product_id   = ?
       AND available_quantity >= ?`,
    [quantity, warehouseId, productId, quantity]
  );
}

module.exports = {
  getProductInventory,
  getWarehouseInventory,
  getAvailableWarehouses,
  deductInventory,
};
