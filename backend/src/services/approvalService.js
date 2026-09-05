/**
 * approvalService.js — Phase 6: Automatic Approval Workflow
 *
 * Responsibilities:
 *   - Configurable risk-score thresholds → routing decision
 *   - GET pending approvals (role-filtered)
 *   - Approve (Manager / Finance, sequential)
 *   - Reject
 *   - Request revision (SALES_MANAGER only)
 *   - Immutable audit trail for every action
 */

const pool = require("../config/db");

// ─── Task 20 — Configurable thresholds ───────────────────────────────────────
// Centralised so they can be changed in one place without touching any controller.
//
//   risk_score < MANAGER        → NO_APPROVAL  (auto-approved)
//   MANAGER <= risk < FINANCE   → SALES_MANAGER
//   risk_score >= FINANCE       → SALES_MANAGER → FINANCE (sequential)

const APPROVAL_THRESHOLDS = {
  MANAGER: 5,  // any blended excess >= 5 requires a manager to sign off
  FINANCE: 15, // large total excess also requires Finance (sequential)
};

// ─── Task 20 — Routing engine (pure function, no I/O) ─────────────────────────

function determineApproval(riskScore) {
  if (riskScore < APPROVAL_THRESHOLDS.MANAGER) {
    return { approvalRequired: false, level: "NO_APPROVAL", requiresFinance: false };
  }
  if (riskScore >= APPROVAL_THRESHOLDS.FINANCE) {
    return { approvalRequired: true,  level: "SALES_MANAGER", requiresFinance: true  };
  }
  return   { approvalRequired: true,  level: "SALES_MANAGER", requiresFinance: false };
}

// ─── Task 22 — GET /api/approvals/pending ─────────────────────────────────────

async function getPendingApprovals(userRole) {
  const base = `
    SELECT
      a.id, a.quote_id, a.approver_role, a.sequence_number, a.status,
      a.created_at,
      q.status        AS quote_status,
      q.grand_total,  q.risk_score,
      c.name          AS customer_name, c.tier AS customer_tier,
      u.name          AS sales_rep_name
    FROM approvals a
    JOIN quotes    q ON q.id = a.quote_id
    JOIN customers c ON c.id = q.customer_id
    JOIN users     u ON u.id = q.sales_rep_id`;

  if (userRole === "SALES_MANAGER") {
    // Manager sees their own pending records (always sequence 1)
    const [rows] = await pool.query(
      `${base}
       WHERE a.approver_role = 'SALES_MANAGER' AND a.status = 'PENDING'
       ORDER BY a.created_at DESC`
    );
    return rows;
  }

  if (userRole === "FINANCE") {
    // Finance sees pending records only when the preceding Manager step is APPROVED
    const [rows] = await pool.query(
      `${base}
       WHERE a.approver_role = 'FINANCE'
         AND a.status = 'PENDING'
         AND EXISTS (
           SELECT 1 FROM approvals prev
           WHERE prev.quote_id      = a.quote_id
             AND prev.sequence_number = a.sequence_number - 1
             AND prev.status         = 'APPROVED'
         )
       ORDER BY a.created_at DESC`
    );
    return rows;
  }

  return [];
}

// ─── Shared helper — find the actionable pending approval ─────────────────────

async function findPendingApproval(conn, quoteId, approverRole) {
  const [rows] = await conn.query(
    `SELECT * FROM approvals
     WHERE quote_id = ? AND approver_role = ? AND status = 'PENDING'
     ORDER BY sequence_number ASC LIMIT 1`,
    [quoteId, approverRole]
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Task 22/23 — Approve ─────────────────────────────────────────────────────

async function approveQuote(quoteId, userId, userRole) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Find pending approval for this role
    const approval = await findPendingApproval(conn, quoteId, userRole);
    if (!approval) {
      const err = new Error(`No pending ${userRole} approval found for this quote`);
      err.status = 400; throw err;
    }

    // Finance: verify the preceding Manager step is already APPROVED
    if (userRole === "FINANCE") {
      const [prevRows] = await conn.query(
        `SELECT status FROM approvals
         WHERE quote_id = ? AND sequence_number = ?`,
        [quoteId, approval.sequence_number - 1]
      );
      if (!prevRows.length || prevRows[0].status !== "APPROVED") {
        const err = new Error("Manager approval must be completed before Finance can act");
        err.status = 400; throw err;
      }
    }

    // Validate quote is in the expected state
    const [qRows] = await conn.query("SELECT status FROM quotes WHERE id = ?", [quoteId]);
    if (!qRows.length) { const e = new Error("Quote not found"); e.status = 404; throw e; }
    const prevStatus = qRows[0].status;
    const expectedStatus = userRole === "SALES_MANAGER" ? "PENDING_MANAGER" : "PENDING_FINANCE";
    if (prevStatus !== expectedStatus) {
      const err = new Error(`Cannot approve: quote is '${prevStatus}', expected '${expectedStatus}'`);
      err.status = 400; throw err;
    }

    // Determine next status
    let newStatus;
    if (userRole === "SALES_MANAGER") {
      const [financeRows] = await conn.query(
        `SELECT id FROM approvals WHERE quote_id = ? AND approver_role = 'FINANCE'`,
        [quoteId]
      );
      newStatus = financeRows.length > 0 ? "PENDING_FINANCE" : "APPROVED";
    } else {
      newStatus = "APPROVED"; // Finance is always the last step
    }

    const action = userRole === "SALES_MANAGER" ? "MANAGER_APPROVED" : "FINANCE_APPROVED";

    await conn.query(
      `UPDATE approvals
       SET status = 'APPROVED', approver_id = ?, acted_at = NOW()
       WHERE id = ?`,
      [userId, approval.id]
    );
    await conn.query("UPDATE quotes SET status = ? WHERE id = ?", [newStatus, quoteId]);
    await conn.query(
      `INSERT INTO approval_audit_logs
         (quote_id, user_id, action, previous_status, new_status)
       VALUES (?, ?, ?, ?, ?)`,
      [quoteId, userId, action, prevStatus, newStatus]
    );

    await conn.commit();
    return { quoteId, previousStatus: prevStatus, newStatus, action };
  } catch (err) {
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }
}

// ─── Task 22 — Reject ─────────────────────────────────────────────────────────

async function rejectQuote(quoteId, userId, userRole, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const approval = await findPendingApproval(conn, quoteId, userRole);
    if (!approval) {
      const err = new Error(`No pending ${userRole} approval found for this quote`);
      err.status = 400; throw err;
    }

    const [qRows] = await conn.query("SELECT status FROM quotes WHERE id = ?", [quoteId]);
    if (!qRows.length) { const e = new Error("Quote not found"); e.status = 404; throw e; }
    const prevStatus = qRows[0].status;

    const action = userRole === "SALES_MANAGER" ? "MANAGER_REJECTED" : "FINANCE_REJECTED";

    await conn.query(
      `UPDATE approvals
       SET status = 'REJECTED', approver_id = ?, reason = ?, acted_at = NOW()
       WHERE id = ?`,
      [userId, reason || null, approval.id]
    );
    await conn.query("UPDATE quotes SET status = 'REJECTED' WHERE id = ?", [quoteId]);
    await conn.query(
      `INSERT INTO approval_audit_logs
         (quote_id, user_id, action, previous_status, new_status, reason)
       VALUES (?, ?, ?, ?, 'REJECTED', ?)`,
      [quoteId, userId, action, prevStatus, reason || null]
    );

    await conn.commit();
    return { quoteId, previousStatus: prevStatus, newStatus: "REJECTED", action };
  } catch (err) {
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }
}

// ─── Task 22 — Request revision (SALES_MANAGER only) ─────────────────────────

async function requestRevision(quoteId, userId, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Only Manager can request revision — must have a pending Manager approval
    const approval = await findPendingApproval(conn, quoteId, "SALES_MANAGER");
    if (!approval) {
      const err = new Error("No pending SALES_MANAGER approval found for this quote");
      err.status = 400; throw err;
    }

    const [qRows] = await conn.query("SELECT status FROM quotes WHERE id = ?", [quoteId]);
    if (!qRows.length) { const e = new Error("Quote not found"); e.status = 404; throw e; }
    const prevStatus = qRows[0].status;

    if (prevStatus !== "PENDING_MANAGER") {
      const err = new Error(`Cannot request revision: quote is '${prevStatus}'`);
      err.status = 400; throw err;
    }

    // Mark all pending approvals on this quote as REVISION_REQUESTED
    await conn.query(
      `UPDATE approvals
       SET status = 'REVISION_REQUESTED', approver_id = ?, reason = ?, acted_at = NOW()
       WHERE quote_id = ? AND status = 'PENDING'`,
      [userId, reason || null, quoteId]
    );
    // Return the quote to DRAFT so the Sales Rep can edit it
    await conn.query("UPDATE quotes SET status = 'DRAFT' WHERE id = ?", [quoteId]);
    await conn.query(
      `INSERT INTO approval_audit_logs
         (quote_id, user_id, action, previous_status, new_status, reason)
       VALUES (?, ?, 'MANAGER_REVISION_REQUESTED', ?, 'DRAFT', ?)`,
      [quoteId, userId, prevStatus, reason || null]
    );

    await conn.commit();
    return { quoteId, previousStatus: prevStatus, newStatus: "DRAFT", action: "MANAGER_REVISION_REQUESTED" };
  } catch (err) {
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  APPROVAL_THRESHOLDS,
  determineApproval,
  getPendingApprovals,
  approveQuote,
  rejectQuote,
  requestRevision,
};
