const pool = require("../config/db");
const { analyzeQuoteDiscounts } = require("./discountService");
const { determineApproval } = require("./approvalService");

// ─────────────────────────────────────────────────────────────────────────────
// TASK 35 — Customer-Safe Quote View
// ─────────────────────────────────────────────────────────────────────────────
// Returns ONLY customer-facing information.
// NEVER exposes: cost, margin, risk_score, approval_notes
//
async function getCustomerQuotation(customerId, quoteId) {
  // Validate quote belongs to customer
  const [qRows] = await pool.query(
    `SELECT
       q.id,
       q.status,
       q.subtotal,
       q.discount_total,
       q.grand_total,
       q.version,
       q.valid_until,
       q.created_at,
       q.updated_at,
       c.id    AS customer_id,
       c.name  AS customer_name,
       c.email AS customer_email,
       c.tier  AS customer_tier,
       u.name  AS sales_rep_name,
       u.email AS sales_rep_email
     FROM quotes q
     JOIN customers c ON c.id = q.customer_id
     JOIN users u ON u.id = q.sales_rep_id
     WHERE q.id = ? AND q.customer_id = ?`,
    [quoteId, customerId]
  );

  if (qRows.length === 0) {
    const err = new Error("Quote not found or access denied");
    err.status = 403;
    throw err;
  }

  const quote = qRows[0];

  // Get quote lines - CUSTOMER-SAFE FIELDS ONLY
  // NO: cost, margin, internal discount calculations
  const [lineRows] = await pool.query(
    `SELECT
       ql.id,
       ql.product_id,
       ql.quantity,
       ql.unit_price,
       ql.discount_percent,
       ql.discount_amount,
       ql.line_total,
       p.name        AS product_name,
       p.sku         AS product_sku,
       p.category    AS product_category,
       p.description AS product_description,
       p.billing_type
     FROM quote_lines ql
     JOIN products p ON p.id = ql.product_id
     WHERE ql.quote_id = ?
     ORDER BY ql.id`,
    [quoteId]
  );

  // Map internal status to customer-friendly status
  const customerStatus = mapToCustomerStatus(quote.status);

  // Get any pending negotiations for this quote
  const [negotiationRows] = await pool.query(
    `SELECT
       id,
       line_id,
       request_type,
       requested_quantity,
       requested_unit_price,
       requested_discount,
       comment,
       status,
       created_at
     FROM negotiations
     WHERE quote_id = ? AND customer_id = ?
     ORDER BY created_at DESC`,
    [quoteId, customerId]
  );

  return {
    quote_id: quote.id,
    status: customerStatus,
    internal_status: quote.status, // For reference, but hide complexity
    subtotal: quote.subtotal,
    discount_total: quote.discount_total,
    grand_total: quote.grand_total,
    version: quote.version,
    valid_until: quote.valid_until,
    created_at: quote.created_at,
    updated_at: quote.updated_at,
    customer: {
      name: quote.customer_name,
      email: quote.customer_email,
      tier: quote.customer_tier,
    },
    sales_rep: {
      name: quote.sales_rep_name,
      email: quote.sales_rep_email,
    },
    lines: lineRows.map(l => ({
      id: l.id,
      product_id: l.product_id,
      product_name: l.product_name,
      product_sku: l.product_sku,
      product_category: l.product_category,
      product_description: l.product_description,
      billing_type: l.billing_type,
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount_percent: l.discount_percent,
      discount_amount: l.discount_amount,
      line_total: l.line_total,
    })),
    negotiations: negotiationRows.map(n => ({
      id: n.id,
      line_id: n.line_id,
      request_type: n.request_type,
      requested_quantity: n.requested_quantity,
      requested_unit_price: n.requested_unit_price,
      requested_discount: n.requested_discount,
      comment: n.comment,
      status: n.status,
      created_at: n.created_at,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Map internal status to customer-friendly labels
// ─────────────────────────────────────────────────────────────────────────────
function mapToCustomerStatus(internalStatus) {
  const statusMap = {
    DRAFT: "In Preparation",
    PENDING_MANAGER: "Under Review",
    PENDING_FINANCE: "Under Review",
    APPROVED: "Ready for Confirmation",
    REJECTED: "Declined",
    UNDER_NEGOTIATION: "Under Negotiation",
    CONFIRMED: "Confirmed",
    FULFILLING: "Processing",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
  };

  return statusMap[internalStatus] || internalStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 36 — Submit Negotiation Request
// ─────────────────────────────────────────────────────────────────────────────
// Customer proposes changes to quote terms.
// Does NOT automatically accept the proposal — that requires re-approval (Task 37).
//
// Supported negotiation types:
// - COMMENT: General comment/question
// - CHANGE_REQUEST: Request modification
// - COUNTER_DISCOUNT: Propose different discount
//
async function submitNegotiation(customerId, quoteId, negotiationData) {
  const {
    line_id,
    request_type,
    requested_quantity,
    requested_unit_price,
    requested_discount,
    comment,
  } = negotiationData;

  // Validate quote belongs to customer
  const [qRows] = await pool.query(
    "SELECT id, customer_id, status FROM quotes WHERE id = ? AND customer_id = ?",
    [quoteId, customerId]
  );

  if (qRows.length === 0) {
    const err = new Error("Quote not found or access denied");
    err.status = 403;
    throw err;
  }

  const quote = qRows[0];

  // Validate quote is in a state that allows negotiation
  const allowedStatuses = ["APPROVED", "UNDER_NEGOTIATION", "PENDING_MANAGER", "PENDING_FINANCE"];
  if (!allowedStatuses.includes(quote.status)) {
    const err = new Error(
      `Cannot negotiate quote with status '${quote.status}'. Quote must be approved or under review.`
    );
    err.status = 400;
    throw err;
  }

  // Validate line belongs to quote (if line_id provided)
  if (line_id) {
    const [lineRows] = await pool.query(
      "SELECT id FROM quote_lines WHERE id = ? AND quote_id = ?",
      [line_id, quoteId]
    );

    if (lineRows.length === 0) {
      const err = new Error("Quote line not found");
      err.status = 404;
      throw err;
    }
  }

  // Validate request_type
  const validTypes = ["COMMENT", "CHANGE_REQUEST", "COUNTER_DISCOUNT"];
  if (!validTypes.includes(request_type)) {
    const err = new Error(`Invalid request_type. Must be one of: ${validTypes.join(", ")}`);
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert negotiation record
    const [result] = await conn.query(
      `INSERT INTO negotiations
         (quote_id, customer_id, line_id, request_type,
          requested_quantity, requested_unit_price, requested_discount,
          comment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
      [quoteId, customerId, line_id, request_type,
       requested_quantity, requested_unit_price, requested_discount, comment]
    );

    const negotiationId = result.insertId;

    // Update quote status to UNDER_NEGOTIATION if it was APPROVED
    if (quote.status === "APPROVED") {
      await conn.query(
        "UPDATE quotes SET status = 'UNDER_NEGOTIATION' WHERE id = ?",
        [quoteId]
      );
    }

    await conn.commit();

    // Return the created negotiation
    const [negRows] = await pool.query(
      `SELECT
         id, quote_id, line_id, request_type,
         requested_quantity, requested_unit_price, requested_discount,
         comment, status, created_at
       FROM negotiations
       WHERE id = ?`,
      [negotiationId]
    );

    return {
      negotiation: negRows[0],
      message: "Negotiation request submitted",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 37 — Apply Negotiation and Trigger Re-Approval
// ─────────────────────────────────────────────────────────────────────────────
// This is called when sales/manager ACCEPTS a customer's negotiation request.
// It applies the negotiated terms and RE-RUNS the entire approval workflow.
//
// CRITICAL: Reuses existing discount/risk/approval engines
//
async function applyNegotiationAndReapprove(negotiationId, approverId) {
  // Get negotiation details
  const [negRows] = await pool.query(
    `SELECT
       n.id, n.quote_id, n.customer_id, n.line_id,
       n.request_type, n.requested_quantity, n.requested_unit_price,
       n.requested_discount, n.comment, n.status,
       q.status AS quote_status
     FROM negotiations n
     JOIN quotes q ON q.id = n.quote_id
     WHERE n.id = ?`,
    [negotiationId]
  );

  if (negRows.length === 0) {
    const err = new Error("Negotiation not found");
    err.status = 404;
    throw err;
  }

  const negotiation = negRows[0];

  if (negotiation.status !== "OPEN") {
    const err = new Error(`Negotiation is already ${negotiation.status}`);
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Step 1: Apply negotiated terms to quote line
    if (negotiation.line_id && negotiation.request_type === "COUNTER_DISCOUNT") {
      // Get current line
      const [lineRows] = await conn.query(
        `SELECT
           ql.id, ql.product_id, ql.quantity, ql.unit_price,
           p.cost
         FROM quote_lines ql
         JOIN products p ON p.id = ql.product_id
         WHERE ql.id = ?`,
        [negotiation.line_id]
      );

      if (lineRows.length === 0) {
        throw new Error("Quote line not found");
      }

      const line = lineRows[0];
      const newDiscount = negotiation.requested_discount || 0;

      // Recalculate line with new discount
      const unitPrice = Number(line.unit_price);
      const cost = Number(line.cost);
      const quantity = negotiation.requested_quantity || line.quantity;

      const gross = parseFloat((unitPrice * quantity).toFixed(2));
      const discountAmt = parseFloat((gross * newDiscount / 100).toFixed(2));
      const lineTotal = parseFloat((gross - discountAmt).toFixed(2));
      const costTotal = parseFloat((cost * quantity).toFixed(2));
      const margin = parseFloat((lineTotal - costTotal).toFixed(2));

      // Update quote line with negotiated terms
      await conn.query(
        `UPDATE quote_lines
         SET quantity = ?, discount_percent = ?,
             discount_amount = ?, line_total = ?, margin = ?
         WHERE id = ?`,
        [quantity, newDiscount, discountAmt, lineTotal, margin, negotiation.line_id]
      );

      // Step 2: Recalculate quote totals
      const [totals] = await conn.query(
        `SELECT
           COALESCE(SUM(unit_price * quantity), 0) AS subtotal,
           COALESCE(SUM(discount_amount), 0)        AS discount_total,
           COALESCE(SUM(line_total), 0)             AS grand_total,
           COALESCE(SUM(margin), 0)                 AS total_margin
         FROM quote_lines
         WHERE quote_id = ?`,
        [negotiation.quote_id]
      );

      const t = totals[0];
      await conn.query(
        `UPDATE quotes
         SET subtotal = ?, discount_total = ?, grand_total = ?, margin = ?
         WHERE id = ?`,
        [t.subtotal, t.discount_total, t.grand_total, t.total_margin, negotiation.quote_id]
      );
    }

    // Mark negotiation as ACCEPTED
    await conn.query(
      "UPDATE negotiations SET status = 'ACCEPTED' WHERE id = ?",
      [negotiationId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Step 3: TASK 37 — Re-run discount governance (reuse Phase 5 engine)
  const { riskScore } = await analyzeQuoteDiscounts(negotiation.quote_id);

  // Step 4: TASK 37 — Determine approval routing (reuse Phase 6 engine)
  const routing = determineApproval(riskScore);

  // Step 5: Update quote status and create approval records if needed
  const connB = await pool.getConnection();
  try {
    await connB.beginTransaction();

    // Clean up old approvals
    await connB.query("DELETE FROM approvals WHERE quote_id = ?", [negotiation.quote_id]);

    let newStatus;

    if (!routing.approvalRequired) {
      newStatus = "APPROVED";
    } else {
      newStatus = "PENDING_MANAGER";

      await connB.query(
        `INSERT INTO approvals (quote_id, approver_role, sequence_number, status)
         VALUES (?, 'SALES_MANAGER', 1, 'PENDING')`,
        [negotiation.quote_id]
      );

      if (routing.requiresFinance) {
        await connB.query(
          `INSERT INTO approvals (quote_id, approver_role, sequence_number, status)
           VALUES (?, 'FINANCE', 2, 'PENDING')`,
          [negotiation.quote_id]
        );
      }
    }

    await connB.query(
      "UPDATE quotes SET status = ? WHERE id = ?",
      [newStatus, negotiation.quote_id]
    );

    // Audit log
    const reason = routing.approvalRequired
      ? `Customer negotiation applied. Risk ${riskScore}: requires ${routing.requiresFinance ? "MANAGER→FINANCE" : "MANAGER"} approval`
      : `Customer negotiation applied. Risk ${riskScore}: auto-approved`;

    await connB.query(
      `INSERT INTO approval_audit_logs
         (quote_id, user_id, action, previous_status, new_status, reason)
       VALUES (?, ?, 'NEGOTIATION_APPLIED', ?, ?, ?)`,
      [negotiation.quote_id, approverId, negotiation.quote_status, newStatus, reason]
    );

    await connB.commit();

    return {
      negotiation_id: negotiationId,
      quote_id: negotiation.quote_id,
      new_status: newStatus,
      risk_score: riskScore,
      approval_required: routing.approvalRequired,
      requires_finance: routing.requiresFinance,
      message: "Negotiation applied and approval workflow triggered",
    };
  } catch (err) {
    await connB.rollback();
    throw err;
  } finally {
    connB.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Confirmation
// ─────────────────────────────────────────────────────────────────────────────
// Customer accepts the quotation.
// Only allowed if quote is APPROVED.
//
async function confirmCustomerQuotation(customerId, quoteId) {
  // Validate quote belongs to customer
  const [qRows] = await pool.query(
    "SELECT id, customer_id, status FROM quotes WHERE id = ? AND customer_id = ?",
    [quoteId, customerId]
  );

  if (qRows.length === 0) {
    const err = new Error("Quote not found or access denied");
    err.status = 403;
    throw err;
  }

  const quote = qRows[0];

  // Only APPROVED quotes can be confirmed by customer
  if (quote.status !== "APPROVED") {
    const err = new Error(
      `Cannot confirm quote with status '${quote.status}'. Quote must be fully approved first.`
    );
    err.status = 400;
    throw err;
  }

  // Update status to CONFIRMED
  await pool.query("UPDATE quotes SET status = 'CONFIRMED' WHERE id = ?", [quoteId]);

  // Audit log
  await pool.query(
    `INSERT INTO approval_audit_logs
       (quote_id, user_id, action, previous_status, new_status, reason)
     VALUES (?, ?, 'CUSTOMER_CONFIRMED', 'APPROVED', 'CONFIRMED', 'Customer confirmed quotation')`,
    [quoteId, customerId]
  );

  return {
    quote_id: quoteId,
    status: "CONFIRMED",
    message: "Quotation confirmed by customer",
  };
}

module.exports = {
  getCustomerQuotation,
  submitNegotiation,
  applyNegotiationAndReapprove,
  confirmCustomerQuotation,
  mapToCustomerStatus,
};
