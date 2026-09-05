const pool = require("../config/db");
const { getQuoteById } = require("./quoteService");

// ─────────────────────────────────────────────────────────────────────────────
// TASK 31 — Calculate Next Billing Date
// ─────────────────────────────────────────────────────────────────────────────
// Given a start date and billing interval, compute the next billing date.
//
// MONTHLY   → +1 month
// QUARTERLY → +3 months
// YEARLY    → +1 year
//
function calculateNextBillingDate(startDate, billingInterval) {
  const date = new Date(startDate);

  switch (billingInterval) {
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "QUARTERLY":
      date.setMonth(date.getMonth() + 3);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error(`Invalid billing interval: ${billingInterval}`);
  }

  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 32 — Calculate Proration
// ─────────────────────────────────────────────────────────────────────────────
// Formula: (monthly price × remaining days) / cycle days
//
// Example:
//   Monthly price = ₹3,000
//   Cycle = 30 days
//   Remaining = 15 days
//   Result = 3000 × 15 / 30 = ₹1,500
//
function calculateProration(monthlyPrice, remainingDays, cycleDays) {
  if (cycleDays <= 0) {
    throw new Error("Cycle days must be greater than 0");
  }
  if (remainingDays < 0 || remainingDays > cycleDays) {
    throw new Error("Remaining days must be between 0 and cycle days");
  }

  const prorated = (monthlyPrice * remainingDays) / cycleDays;
  return parseFloat(prorated.toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 30 — Separate One-Time & Recurring Lines
// ─────────────────────────────────────────────────────────────────────────────
// Groups quote lines by billing_type for hybrid billing.
//
function separateLinesByBillingType(lines) {
  const oneTime = [];
  const recurring = [];

  for (const line of lines) {
    if (line.billing_type === "ONE_TIME") {
      oneTime.push(line);
    } else if (line.billing_type === "RECURRING") {
      recurring.push(line);
    }
  }

  return { oneTime, recurring };
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 30 & 31 — Process Hybrid Billing (main orchestration)
// ─────────────────────────────────────────────────────────────────────────────
// Called after quote confirmation.
// Creates:
//   - ONE_TIME invoice for one-time products
//   - Subscriptions + RECURRING invoices for recurring products
//
async function processHybridBilling(quoteId) {
  const quote = await getQuoteById(quoteId);

  if (quote.status !== "CONFIRMED") {
    const err = new Error(
      `Billing can only be processed for CONFIRMED quotes (current status: ${quote.status})`
    );
    err.status = 400;
    throw err;
  }

  const { oneTime, recurring } = separateLinesByBillingType(quote.lines);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let oneTimeInvoiceId = null;
    let subscriptionIds = [];

    // ── Process ONE_TIME lines ─────────────────────────────────────────────
    if (oneTime.length > 0) {
      const oneTimeTotal = oneTime.reduce((sum, line) => sum + Number(line.line_total), 0);

      // Create ONE_TIME invoice
      const [invoiceResult] = await conn.query(
        `INSERT INTO invoices
           (quote_id, customer_id, invoice_type, amount, status, due_date)
         VALUES (?, ?, 'ONE_TIME', ?, 'UNPAID', DATE_ADD(CURDATE(), INTERVAL 30 DAY))`,
        [quoteId, quote.customer.id, oneTimeTotal]
      );
      oneTimeInvoiceId = invoiceResult.insertId;
    }

    // ── Process RECURRING lines ────────────────────────────────────────────
    for (const line of recurring) {
      // Find or determine the subscription plan
      // For simplicity, we'll look up a plan that matches the product's price
      // In production, products should have a plan_id foreign key
      const [planRows] = await conn.query(
        `SELECT id, name, billing_interval, price, proration_enabled
         FROM subscription_plans
         WHERE price = ?
         LIMIT 1`,
        [line.unit_price]
      );

      let planId;
      let billingInterval;
      let planPrice;

      if (planRows.length > 0) {
        planId = planRows[0].id;
        billingInterval = planRows[0].billing_interval;
        planPrice = planRows[0].price;
      } else {
        // Fallback: create a default MONTHLY plan on the fly
        const [newPlanResult] = await conn.query(
          `INSERT INTO subscription_plans
             (name, billing_interval, price, proration_enabled)
           VALUES (?, 'MONTHLY', ?, TRUE)`,
          [`Plan for ${line.product_name}`, line.unit_price]
        );
        planId = newPlanResult.insertId;
        billingInterval = "MONTHLY";
        planPrice = line.unit_price;
      }

      // Calculate subscription details
      const startDate = new Date().toISOString().split("T")[0]; // Today
      const nextBillingDate = calculateNextBillingDate(startDate, billingInterval);
      const subscriptionAmount = Number(planPrice) * line.quantity;

      // Create subscription
      const [subResult] = await conn.query(
        `INSERT INTO subscriptions
           (quote_id, quote_line_id, customer_id, plan_id, start_date, next_billing_date, quantity, amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [quoteId, line.id, quote.customer.id, planId, startDate, nextBillingDate, line.quantity, subscriptionAmount]
      );
      subscriptionIds.push(subResult.insertId);

      // Create initial RECURRING invoice for the first billing period
      await conn.query(
        `INSERT INTO invoices
           (quote_id, customer_id, invoice_type, amount, status, due_date)
         VALUES (?, ?, 'RECURRING', ?, 'UNPAID', ?)`,
        [quoteId, quote.customer.id, subscriptionAmount, nextBillingDate]
      );
    }

    await conn.commit();

    return {
      quote_id: quoteId,
      one_time_invoice_id: oneTimeInvoiceId,
      subscription_ids: subscriptionIds,
      one_time_count: oneTime.length,
      recurring_count: recurring.length,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Subscriptions for a Customer
// ─────────────────────────────────────────────────────────────────────────────
async function getSubscriptionsByCustomer(customerId) {
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.quote_id,
       s.quote_line_id,
       s.plan_id,
       sp.name          AS plan_name,
       sp.billing_interval,
       sp.price         AS plan_price,
       s.start_date,
       s.next_billing_date,
       s.quantity,
       s.amount,
       s.status,
       s.created_at,
       p.id             AS product_id,
       p.name           AS product_name,
       p.sku            AS product_sku
     FROM subscriptions s
     JOIN subscription_plans sp ON sp.id = s.plan_id
     JOIN quote_lines ql ON ql.id = s.quote_line_id
     JOIN products p ON p.id = ql.product_id
     WHERE s.customer_id = ?
     ORDER BY s.created_at DESC`,
    [customerId]
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Single Subscription
// ─────────────────────────────────────────────────────────────────────────────
async function getSubscriptionById(subscriptionId) {
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.quote_id,
       s.quote_line_id,
       s.customer_id,
       s.plan_id,
       sp.name          AS plan_name,
       sp.billing_interval,
       sp.price         AS plan_price,
       sp.proration_enabled,
       s.start_date,
       s.next_billing_date,
       s.quantity,
       s.amount,
       s.status,
       s.created_at,
       p.id             AS product_id,
       p.name           AS product_name,
       p.sku            AS product_sku,
       c.name           AS customer_name,
       c.email          AS customer_email
     FROM subscriptions s
     JOIN subscription_plans sp ON sp.id = s.plan_id
     JOIN quote_lines ql ON ql.id = s.quote_line_id
     JOIN products p ON p.id = ql.product_id
     JOIN customers c ON c.id = s.customer_id
     WHERE s.id = ?`,
    [subscriptionId]
  );

  if (rows.length === 0) {
    const err = new Error("Subscription not found");
    err.status = 404;
    throw err;
  }

  return rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Subscription (e.g., change quantity mid-cycle with proration)
// ─────────────────────────────────────────────────────────────────────────────
async function updateSubscription(subscriptionId, { quantity, remainingDays, cycleDays }) {
  const subscription = await getSubscriptionById(subscriptionId);

  if (subscription.status !== "ACTIVE") {
    const err = new Error("Can only update ACTIVE subscriptions");
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let proratedAmount = null;

    // If quantity changed and proration is enabled
    if (quantity !== undefined && quantity !== subscription.quantity) {
      if (subscription.proration_enabled && remainingDays !== undefined && cycleDays !== undefined) {
        // Calculate prorated adjustment for the difference
        const unitPrice = Number(subscription.plan_price);
        const quantityDiff = quantity - subscription.quantity;
        const proratedUnit = calculateProration(unitPrice, remainingDays, cycleDays);
        proratedAmount = proratedUnit * quantityDiff;
      }

      // Update subscription quantity
      const newAmount = Number(subscription.plan_price) * quantity;
      await conn.query(
        `UPDATE subscriptions
         SET quantity = ?, amount = ?
         WHERE id = ?`,
        [quantity, newAmount, subscriptionId]
      );

      // If there's a prorated charge, create an adjustment invoice
      if (proratedAmount && proratedAmount !== 0) {
        await conn.query(
          `INSERT INTO invoices
             (quote_id, customer_id, invoice_type, amount, status, due_date)
           VALUES (?, ?, 'RECURRING', ?, 'UNPAID', DATE_ADD(CURDATE(), INTERVAL 7 DAY))`,
          [subscription.quote_id, subscription.customer_id, Math.abs(proratedAmount)]
        );
      }
    }

    await conn.commit();
    return {
      subscription: await getSubscriptionById(subscriptionId),
      prorated_amount: proratedAmount,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel Subscription
// ─────────────────────────────────────────────────────────────────────────────
async function cancelSubscription(subscriptionId) {
  const subscription = await getSubscriptionById(subscriptionId);

  if (subscription.status === "CANCELLED") {
    const err = new Error("Subscription is already cancelled");
    err.status = 400;
    throw err;
  }

  await pool.query(
    "UPDATE subscriptions SET status = 'CANCELLED' WHERE id = ?",
    [subscriptionId]
  );

  return getSubscriptionById(subscriptionId);
}

module.exports = {
  calculateNextBillingDate,
  calculateProration,
  separateLinesByBillingType,
  processHybridBilling,
  getSubscriptionsByCustomer,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
};
