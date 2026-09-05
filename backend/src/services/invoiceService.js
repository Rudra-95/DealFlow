const pool = require("../config/db");

// ─────────────────────────────────────────────────────────────────────────────
// TASK 33 — Get All Invoices (role-filtered)
// ─────────────────────────────────────────────────────────────────────────────
// Returns invoices visible to the authenticated user based on their role.
//
async function getInvoices(userId, userRole) {
  let query = `
    SELECT
      i.id,
      i.quote_id,
      i.customer_id,
      c.name          AS customer_name,
      c.email         AS customer_email,
      i.invoice_type,
      i.amount,
      i.status,
      i.due_date,
      i.created_at,
      q.grand_total   AS quote_total
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    JOIN quotes q ON q.id = i.quote_id
  `;

  const params = [];

  // RBAC: SALES_REP can only see invoices for their own quotes
  if (userRole === "SALES_REP") {
    query += " JOIN users u ON u.id = q.sales_rep_id WHERE u.id = ?";
    params.push(userId);
  } else if (userRole === "CUSTOMER") {
    // CUSTOMER can only see their own invoices
    query += " WHERE i.customer_id = ?";
    params.push(userId);
  }

  query += " ORDER BY i.created_at DESC";

  const [rows] = await pool.query(query, params);
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 33 — Get Single Invoice
// ─────────────────────────────────────────────────────────────────────────────
async function getInvoiceById(invoiceId) {
  const [rows] = await pool.query(
    `SELECT
       i.id,
       i.quote_id,
       i.customer_id,
       c.name          AS customer_name,
       c.email         AS customer_email,
       c.tier          AS customer_tier,
       i.invoice_type,
       i.amount,
       i.status,
       i.due_date,
       i.created_at,
       q.grand_total   AS quote_total,
       q.sales_rep_id,
       u.name          AS sales_rep_name
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN quotes q ON q.id = i.quote_id
     JOIN users u ON u.id = q.sales_rep_id
     WHERE i.id = ?`,
    [invoiceId]
  );

  if (rows.length === 0) {
    const err = new Error("Invoice not found");
    err.status = 404;
    throw err;
  }

  // Get associated payments
  const [payments] = await pool.query(
    `SELECT
       id,
       amount,
       payment_method,
       paid_at
     FROM payments
     WHERE invoice_id = ?
     ORDER BY paid_at DESC`,
    [invoiceId]
  );

  return {
    ...rows[0],
    payments,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 33 — Process Payment
// ─────────────────────────────────────────────────────────────────────────────
// For hackathon: simplified payment that updates UNPAID → PAID.
// In production, this would integrate with a real payment gateway.
//
// Body shape:
// {
//   "amount": 100000,
//   "payment_method": "CREDIT_CARD"
// }
//
async function processPayment(invoiceId, { amount, payment_method = "CREDIT_CARD" }) {
  const invoice = await getInvoiceById(invoiceId);

  // Validation: invoice must be UNPAID
  if (invoice.status !== "UNPAID") {
    const err = new Error(
      `Cannot process payment for invoice with status '${invoice.status}'`
    );
    err.status = 400;
    throw err;
  }

  // Validation: payment amount should match invoice amount (simplified)
  const invoiceAmount = Number(invoice.amount);
  const paymentAmount = Number(amount);

  if (paymentAmount <= 0) {
    const err = new Error("Payment amount must be greater than 0");
    err.status = 400;
    throw err;
  }

  if (paymentAmount !== invoiceAmount) {
    const err = new Error(
      `Payment amount (${paymentAmount}) does not match invoice amount (${invoiceAmount})`
    );
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create payment record
    const [paymentResult] = await conn.query(
      `INSERT INTO payments
         (invoice_id, amount, payment_method, paid_at)
       VALUES (?, ?, ?, NOW())`,
      [invoiceId, paymentAmount, payment_method]
    );

    // Update invoice status to PAID
    await conn.query(
      "UPDATE invoices SET status = 'PAID' WHERE id = ?",
      [invoiceId]
    );

    await conn.commit();

    return {
      invoice: await getInvoiceById(invoiceId),
      payment_id: paymentResult.insertId,
      message: "Payment processed successfully",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Invoices for a Specific Quote
// ─────────────────────────────────────────────────────────────────────────────
async function getInvoicesByQuote(quoteId) {
  const [rows] = await pool.query(
    `SELECT
       i.id,
       i.quote_id,
       i.customer_id,
       c.name          AS customer_name,
       i.invoice_type,
       i.amount,
       i.status,
       i.due_date,
       i.created_at
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     WHERE i.quote_id = ?
     ORDER BY i.created_at DESC`,
    [quoteId]
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Invoices for a Specific Customer
// ─────────────────────────────────────────────────────────────────────────────
async function getInvoicesByCustomer(customerId) {
  const [rows] = await pool.query(
    `SELECT
       i.id,
       i.quote_id,
       i.invoice_type,
       i.amount,
       i.status,
       i.due_date,
       i.created_at
     FROM invoices
     WHERE customer_id = ?
     ORDER BY created_at DESC`,
    [customerId]
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel Invoice (admin operation)
// ─────────────────────────────────────────────────────────────────────────────
async function cancelInvoice(invoiceId) {
  const invoice = await getInvoiceById(invoiceId);

  if (invoice.status === "PAID") {
    const err = new Error("Cannot cancel a PAID invoice");
    err.status = 400;
    throw err;
  }

  if (invoice.status === "CANCELLED") {
    const err = new Error("Invoice is already cancelled");
    err.status = 400;
    throw err;
  }

  await pool.query(
    "UPDATE invoices SET status = 'CANCELLED' WHERE id = ?",
    [invoiceId]
  );

  return getInvoiceById(invoiceId);
}

module.exports = {
  getInvoices,
  getInvoiceById,
  processPayment,
  getInvoicesByQuote,
  getInvoicesByCustomer,
  cancelInvoice,
};
