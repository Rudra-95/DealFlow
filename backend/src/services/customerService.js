const pool = require("../config/db");

// ─── Get customer by ID ───────────────────────────────────────────────────────
async function getCustomerById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, tier, created_at
     FROM customers
     WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error("Customer not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

// ─── Get only the tier (used heavily by the discount engine) ──────────────────
async function getCustomerTier(id) {
  const [rows] = await pool.query(
    "SELECT tier FROM customers WHERE id = ?",
    [id]
  );
  if (rows.length === 0) {
    const err = new Error("Customer not found");
    err.status = 404;
    throw err;
  }
  return rows[0].tier; // "GOLD" | "SILVER" | "BRONZE"
}

// ─── Get all customers (used internally for dropdowns / admin views) ──────────
async function getAllCustomers() {
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, tier, created_at
     FROM customers
     ORDER BY name`
  );
  return rows;
}

module.exports = { getCustomerById, getCustomerTier, getAllCustomers };
