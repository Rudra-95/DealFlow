const pool                 = require("../config/db");
const { getCustomerById }  = require("./customerService");
const { getProductWithCost } = require("./productService");

// ─── Pure line calculation (no I/O) ──────────────────────────────────────────
// All values come from the database — never from frontend input.

function calculateLine(unitPrice, cost, quantity, discountPercent) {
  const gross      = parseFloat((unitPrice * quantity).toFixed(2));
  const discountAmt = parseFloat((gross * discountPercent / 100).toFixed(2));
  const lineTotal  = parseFloat((gross - discountAmt).toFixed(2));
  const costTotal  = parseFloat((cost * quantity).toFixed(2));
  const margin     = parseFloat((lineTotal - costTotal).toFixed(2));
  return { gross, discountAmt, lineTotal, costTotal, margin };
}

// ─── Recalculate and persist quote totals from its current lines ──────────────
// Must be called inside a transaction (conn, not pool).

async function recalculateQuote(conn, quoteId) {
  const [rows] = await conn.query(
    `SELECT
       COALESCE(SUM(unit_price * quantity), 0) AS subtotal,
       COALESCE(SUM(discount_amount), 0)        AS discount_total,
       COALESCE(SUM(line_total), 0)             AS grand_total,
       COALESCE(SUM(margin), 0)                 AS total_margin
     FROM quote_lines
     WHERE quote_id = ?`,
    [quoteId]
  );
  const t = rows[0];
  await conn.query(
    `UPDATE quotes
     SET subtotal = ?, discount_total = ?, grand_total = ?, margin = ?
     WHERE id = ?`,
    [t.subtotal, t.discount_total, t.grand_total, t.total_margin, quoteId]
  );
  return t;
}

// ─── CREATE QUOTE ─────────────────────────────────────────────────────────────

async function createQuote(salesRepId, customerId) {
  await getCustomerById(customerId); // throws 404 if customer doesn't exist

  const [result] = await pool.query(
    `INSERT INTO quotes
       (customer_id, sales_rep_id, status, subtotal, discount_total, grand_total, margin, risk_score)
     VALUES (?, ?, 'DRAFT', 0, 0, 0, 0, 0)`,
    [customerId, salesRepId]
  );
  return getQuoteById(result.insertId);
}

// ─── GET ALL QUOTES (role-filtered) ──────────────────────────────────────────

async function getQuotes(userId, userRole) {
  const where  = userRole === "SALES_REP" ? "WHERE q.sales_rep_id = ?" : "";
  const params = userRole === "SALES_REP" ? [userId] : [];

  const [rows] = await pool.query(
    `SELECT
       q.id, q.status, q.subtotal, q.discount_total, q.grand_total,
       q.margin, q.risk_score, q.version, q.valid_until,
       q.created_at, q.updated_at,
       c.id   AS customer_id,  c.name AS customer_name,  c.tier AS customer_tier,
       u.id   AS sales_rep_id, u.name AS sales_rep_name
     FROM quotes q
     JOIN customers c ON c.id = q.customer_id
     JOIN users     u ON u.id = q.sales_rep_id
     ${where}
     ORDER BY q.created_at DESC`,
    params
  );

  return rows.map(r => ({
    id:             r.id,
    status:         r.status,
    subtotal:       r.subtotal,
    discount_total: r.discount_total,
    grand_total:    r.grand_total,
    margin:         r.margin,
    risk_score:     r.risk_score,
    version:        r.version,
    valid_until:    r.valid_until,
    created_at:     r.created_at,
    updated_at:     r.updated_at,
    customer:  { id: r.customer_id,  name: r.customer_name,  tier: r.customer_tier },
    sales_rep: { id: r.sales_rep_id, name: r.sales_rep_name },
  }));
}

// ─── GET SINGLE QUOTE WITH LINES ─────────────────────────────────────────────

async function getQuoteById(quoteId) {
  const [qRows] = await pool.query(
    `SELECT
       q.id, q.status, q.subtotal, q.discount_total, q.grand_total,
       q.margin, q.risk_score, q.version, q.valid_until,
       q.created_at, q.updated_at,
       c.id    AS customer_id,    c.name  AS customer_name,
       c.email AS customer_email, c.tier  AS customer_tier,
       u.id    AS sales_rep_id,   u.name  AS sales_rep_name,
       u.email AS sales_rep_email
     FROM quotes q
     JOIN customers c ON c.id = q.customer_id
     JOIN users     u ON u.id = q.sales_rep_id
     WHERE q.id = ?`,
    [quoteId]
  );

  if (qRows.length === 0) {
    const err = new Error("Quote not found"); err.status = 404; throw err;
  }
  const q = qRows[0];

  const [lineRows] = await pool.query(
    `SELECT
       ql.id, ql.product_id, ql.quantity, ql.unit_price,
       ql.discount_percent, ql.discount_amount, ql.line_total, ql.margin,
       p.name     AS product_name, p.sku      AS product_sku,
       p.category AS product_category, p.billing_type
     FROM quote_lines ql
     JOIN products p ON p.id = ql.product_id
     WHERE ql.quote_id = ?
     ORDER BY ql.id`,
    [quoteId]
  );

  return {
    id:             q.id,
    status:         q.status,
    subtotal:       q.subtotal,
    discount_total: q.discount_total,
    grand_total:    q.grand_total,
    margin:         q.margin,
    risk_score:     q.risk_score,
    version:        q.version,
    valid_until:    q.valid_until,
    created_at:     q.created_at,
    updated_at:     q.updated_at,
    customer: {
      id:    q.customer_id,
      name:  q.customer_name,
      email: q.customer_email,
      tier:  q.customer_tier,
    },
    sales_rep: {
      id:    q.sales_rep_id,
      name:  q.sales_rep_name,
      email: q.sales_rep_email,
    },
    lines: lineRows.map(l => ({
      id:               l.id,
      product_id:       l.product_id,
      product_name:     l.product_name,
      product_sku:      l.product_sku,
      product_category: l.product_category,
      billing_type:     l.billing_type,
      quantity:         l.quantity,
      unit_price:       l.unit_price,
      discount_percent: l.discount_percent,
      discount_amount:  l.discount_amount,
      line_total:       l.line_total,
      margin:           l.margin,
    })),
  };
}

// ─── UPDATE QUOTE (metadata only — financials are always computed) ─────────────

async function updateQuote(quoteId, userId, userRole, { valid_until }) {
  const existing = await getQuoteById(quoteId);

  if (userRole === "SALES_REP" && existing.sales_rep.id !== userId) {
    const err = new Error("You can only edit your own quotes"); err.status = 403; throw err;
  }
  if (existing.status !== "DRAFT") {
    const err = new Error(`Cannot edit a quote with status '${existing.status}'`);
    err.status = 400; throw err;
  }

  // Only metadata fields — never grand_total, margin, subtotal
  if (valid_until !== undefined) {
    await pool.query("UPDATE quotes SET valid_until = ? WHERE id = ?", [valid_until, quoteId]);
  }

  return getQuoteById(quoteId);
}

// ─── ADD LINE ─────────────────────────────────────────────────────────────────

async function addQuoteLine(quoteId, { product_id, quantity, discount_percent = 0 }) {
  const quote   = await getQuoteById(quoteId);
  if (quote.status !== "DRAFT") {
    const err = new Error("Lines can only be added to a DRAFT quote"); err.status = 400; throw err;
  }

  const product = await getProductWithCost(product_id);
  if (!product.active) {
    const err = new Error(`Product '${product.name}' is not active`); err.status = 400; throw err;
  }

  const calc = calculateLine(
    Number(product.price), Number(product.cost), quantity, discount_percent
  );

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO quote_lines
         (quote_id, product_id, quantity, unit_price, discount_percent,
          discount_amount, line_total, margin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [quoteId, product_id, quantity, product.price, discount_percent,
       calc.discountAmt, calc.lineTotal, calc.margin]
    );

    await recalculateQuote(conn, quoteId);
    await conn.commit();
    return getQuoteById(quoteId);
  } catch (err) {
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }
}

// ─── UPDATE LINE ──────────────────────────────────────────────────────────────

async function updateQuoteLine(quoteId, lineId, { quantity, discount_percent }) {
  await getQuoteById(quoteId); // validate quote exists

  const [lineRows] = await pool.query(
    "SELECT * FROM quote_lines WHERE id = ? AND quote_id = ?",
    [lineId, quoteId]
  );
  if (lineRows.length === 0) {
    const err = new Error("Quote line not found"); err.status = 404; throw err;
  }
  const line = lineRows[0];

  const newQty  = quantity          !== undefined ? parseInt(quantity, 10)       : line.quantity;
  const newDisc = discount_percent  !== undefined ? Number(discount_percent)     : Number(line.discount_percent);

  // Always re-fetch product price/cost in case it changed
  const product = await getProductWithCost(line.product_id);
  const calc    = calculateLine(Number(product.price), Number(product.cost), newQty, newDisc);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE quote_lines
       SET quantity = ?, discount_percent = ?,
           discount_amount = ?, line_total = ?, margin = ?
       WHERE id = ?`,
      [newQty, newDisc, calc.discountAmt, calc.lineTotal, calc.margin, lineId]
    );

    await recalculateQuote(conn, quoteId);
    await conn.commit();
    return getQuoteById(quoteId);
  } catch (err) {
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }
}

// ─── DELETE LINE ──────────────────────────────────────────────────────────────

async function deleteQuoteLine(quoteId, lineId) {
  await getQuoteById(quoteId);

  const [lineRows] = await pool.query(
    "SELECT id FROM quote_lines WHERE id = ? AND quote_id = ?",
    [lineId, quoteId]
  );
  if (lineRows.length === 0) {
    const err = new Error("Quote line not found"); err.status = 404; throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM quote_lines WHERE id = ?", [lineId]);
    await recalculateQuote(conn, quoteId); // zeroes out totals if no lines remain
    await conn.commit();
    return getQuoteById(quoteId);
  } catch (err) {
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
  addQuoteLine,
  updateQuoteLine,
  deleteQuoteLine,
};
