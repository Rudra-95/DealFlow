const pool = require("../config/db");
const { getQuoteById } = require("./quoteService");
const {
  getAvailableWarehouses,
  getWarehouseInventory,
} = require("./inventoryService");

// ─────────────────────────────────────────────────────────────────────────────
// TASK 25 — Warehouse Allocation Algorithm
// ─────────────────────────────────────────────────────────────────────────────
// Pure function — no I/O.
// Receives product inventory rows (already sorted by shipping_cost_weight ASC)
// and greedily allocates from the cheapest warehouse first.
//
// Returns:
//   allocations  — array of { warehouse_id, warehouse_name, quantity, shipping_cost_weight }
//   fulfilled    — total units actually allocated
//   backorder    — units that could not be fulfilled (Task 26)
//
function allocate(requiredQty, inventoryRows) {
  let remaining = requiredQty;
  const allocations = [];

  for (const row of inventoryRows) {
    if (remaining <= 0) break;

    const take = Math.min(row.available_quantity, remaining);
    if (take <= 0) continue;

    allocations.push({
      warehouse_id:        row.id ?? row.warehouse_id,
      warehouse_name:      row.name ?? row.warehouse_name,
      quantity:            take,
      shipping_cost_weight: Number(row.shipping_cost_weight),
    });

    remaining -= take;
  }

  // TASK 26 — Backorder Calculation
  const fulfilled = requiredQty - remaining;
  const backorder = remaining; // > 0 means stock was insufficient

  return { allocations, fulfilled, backorder };
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 27 (service layer) — GET fulfillment suggestion
// ─────────────────────────────────────────────────────────────────────────────
// Reads all quote lines, resolves inventory for each product, and returns
// the suggested warehouse split.
//
// Only works on APPROVED quotes (fulfillment begins after approval).
//
async function getFulfillmentSuggestion(quoteId) {
  const quote = await getQuoteById(quoteId);

  if (quote.status !== "APPROVED" && quote.status !== "FULFILLING") {
    const err = new Error(
      `Fulfillment is only available for APPROVED quotes (current status: ${quote.status})`
    );
    err.status = 400;
    throw err;
  }

  if (quote.lines.length === 0) {
    const err = new Error("Quote has no line items");
    err.status = 400;
    throw err;
  }

  // Build suggestion per line
  const lineSuggestions = [];
  let totalFulfilled = 0;
  let totalBackorder = 0;

  for (const line of quote.lines) {
    const inventoryRows = await getAvailableWarehouses(line.product_id);
    const { allocations, fulfilled, backorder } = allocate(line.quantity, inventoryRows);

    totalFulfilled += fulfilled;
    totalBackorder += backorder;

    lineSuggestions.push({
      quote_line_id:      line.id,
      product_id:         line.product_id,
      product_name:       line.product_name,
      product_sku:        line.product_sku,
      required_quantity:  line.quantity,
      allocations,
      fulfilled_quantity: fulfilled,
      backorder_quantity: backorder,
    });
  }

  return {
    quote_id:           quoteId,
    status:             quote.status,
    lines:              lineSuggestions,
    total_fulfilled:    totalFulfilled,
    total_backorder:    totalBackorder,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 28 — Inventory Reservation / Reduction (transactional)
// ─────────────────────────────────────────────────────────────────────────────
// Shared by both accept-suggested and manual-override flows.
//
// allocationsByLine is an array of:
// {
//   quote_line_id,
//   product_id,
//   allocations: [ { warehouse_id, quantity } ]
// }
//
// Steps inside ONE transaction:
//   1. FOR UPDATE lock on each inventory row  (prevents double-spend)
//   2. Validate stock is still sufficient
//   3. UPDATE inventory (deduct)
//   4. INSERT fulfillment_allocations
//   5. UPDATE quotes.status → 'FULFILLING'
//
async function commitFulfillment(quoteId, allocationsByLine) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Clear any previous SUGGESTED allocations for this quote
    // (re-running accept should be idempotent if status allows it)
    await conn.query(
      "DELETE FROM fulfillment_allocations WHERE quote_id = ? AND status = 'SUGGESTED'",
      [quoteId]
    );

    for (const lineAlloc of allocationsByLine) {
      const { quote_line_id, product_id, allocations } = lineAlloc;

      for (const alloc of allocations) {
        const { warehouse_id, quantity } = alloc;

        // Step 1 — lock the inventory row
        const [lockRows] = await conn.query(
          `SELECT available_quantity
           FROM inventory
           WHERE warehouse_id = ? AND product_id = ?
           FOR UPDATE`,
          [warehouse_id, product_id]
        );

        if (lockRows.length === 0) {
          const err = new Error(
            `No inventory record for product ${product_id} in warehouse ${warehouse_id}`
          );
          err.status = 400;
          throw err;
        }

        const currentStock = lockRows[0].available_quantity;

        // Step 2 — validate stock is still sufficient
        if (currentStock < quantity) {
          const err = new Error(
            `Insufficient stock: warehouse ${warehouse_id} has ${currentStock} units of product ${product_id} ` +
            `but ${quantity} were requested`
          );
          err.status = 400;
          throw err;
        }

        // Step 3 — deduct inventory
        await conn.query(
          `UPDATE inventory
           SET available_quantity = available_quantity - ?
           WHERE warehouse_id = ? AND product_id = ?`,
          [quantity, warehouse_id, product_id]
        );

        // Step 4 — record fulfillment allocation
        // shipping_cost = quantity × shipping_cost_weight (simple model)
        const [warehouseRows] = await conn.query(
          "SELECT shipping_cost_weight FROM warehouses WHERE id = ?",
          [warehouse_id]
        );
        const shippingCostWeight = warehouseRows.length > 0
          ? Number(warehouseRows[0].shipping_cost_weight)
          : 0;
        const shippingCost = parseFloat((quantity * shippingCostWeight).toFixed(2));

        await conn.query(
          `INSERT INTO fulfillment_allocations
             (quote_id, quote_line_id, warehouse_id, quantity_allocated, shipping_cost, status)
           VALUES (?, ?, ?, ?, ?, 'ACCEPTED')`,
          [quoteId, quote_line_id, warehouse_id, quantity, shippingCost]
        );
      }
    }

    // Step 5 — advance quote status to FULFILLING
    await conn.query(
      "UPDATE quotes SET status = 'FULFILLING' WHERE id = ?",
      [quoteId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 27 — Accept Suggested Split
// ─────────────────────────────────────────────────────────────────────────────
// Re-calculates the suggestion fresh (inventory may have changed since GET)
// then commits it transactionally.
//
async function acceptSuggestedFulfillment(quoteId) {
  const quote = await getQuoteById(quoteId);

  if (quote.status !== "APPROVED") {
    const err = new Error(
      `Only APPROVED quotes can be accepted for fulfillment (current status: ${quote.status})`
    );
    err.status = 400;
    throw err;
  }

  // Re-compute suggestion with current stock (Task 28 note: don't trust stale data)
  const suggestion = await getFulfillmentSuggestion(quoteId);

  // Build the allocationsByLine shape expected by commitFulfillment
  const allocationsByLine = suggestion.lines
    .filter(l => l.allocations.length > 0)
    .map(l => ({
      quote_line_id: l.quote_line_id,
      product_id:    l.product_id,
      allocations:   l.allocations.map(a => ({
        warehouse_id: a.warehouse_id,
        quantity:     a.quantity,
      })),
    }));

  if (allocationsByLine.length === 0) {
    const err = new Error("No stock available for any line item — cannot accept fulfillment");
    err.status = 400;
    throw err;
  }

  await commitFulfillment(quoteId, allocationsByLine);

  return {
    quote_id:        quoteId,
    message:         "Fulfillment accepted and inventory reserved",
    total_fulfilled: suggestion.total_fulfilled,
    total_backorder: suggestion.total_backorder,
    lines:           suggestion.lines,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 27 — Manual Override
// ─────────────────────────────────────────────────────────────────────────────
// The frontend sends an explicit warehouse split.
// Backend validates everything before touching inventory.
//
// Input body shape:
// {
//   "allocations": [
//     { "quote_line_id": 3, "warehouse_id": 1, "quantity": 2 },
//     { "quote_line_id": 3, "warehouse_id": 2, "quantity": 3 }
//   ]
// }
//
async function manualOverrideFulfillment(quoteId, rawAllocations) {
  // ── 1. Validate quote ──────────────────────────────────────────────────────
  const quote = await getQuoteById(quoteId);

  if (quote.status !== "APPROVED") {
    const err = new Error(
      `Only APPROVED quotes can be overridden for fulfillment (current status: ${quote.status})`
    );
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(rawAllocations) || rawAllocations.length === 0) {
    const err = new Error("allocations array is required and must not be empty");
    err.status = 400;
    throw err;
  }

  // ── 2. Build a lookup: quote_line_id → { product_id, required_quantity } ──
  const lineMap = {};
  for (const line of quote.lines) {
    lineMap[line.id] = {
      product_id:        line.product_id,
      required_quantity: line.quantity,
    };
  }

  // ── 3. Group allocations by quote_line_id ──────────────────────────────────
  const groupedMap = {};
  for (const alloc of rawAllocations) {
    const { quote_line_id, warehouse_id, quantity } = alloc;

    // Validate fields
    if (!quote_line_id || !warehouse_id || !quantity) {
      const err = new Error(
        "Each allocation must include quote_line_id, warehouse_id, and quantity"
      );
      err.status = 400;
      throw err;
    }
    if (quantity <= 0) {
      const err = new Error("Allocation quantity must be a positive integer");
      err.status = 400;
      throw err;
    }

    // Validate quote_line_id belongs to this quote
    if (!lineMap[quote_line_id]) {
      const err = new Error(
        `quote_line_id ${quote_line_id} does not belong to quote ${quoteId}`
      );
      err.status = 400;
      throw err;
    }

    if (!groupedMap[quote_line_id]) groupedMap[quote_line_id] = [];
    groupedMap[quote_line_id].push({ warehouse_id, quantity });
  }

  // ── 4. Validate totals match required quantities ───────────────────────────
  for (const [lineIdStr, allocList] of Object.entries(groupedMap)) {
    const lineId = parseInt(lineIdStr, 10);
    const { required_quantity } = lineMap[lineId];
    const totalAllocated = allocList.reduce((sum, a) => sum + a.quantity, 0);

    if (totalAllocated !== required_quantity) {
      const err = new Error(
        `Total allocated quantity (${totalAllocated}) for quote_line_id ${lineId} ` +
        `does not match required quantity (${required_quantity})`
      );
      err.status = 400;
      throw err;
    }
  }

  // ── 5. Validate warehouse stock (pre-check before transaction) ─────────────
  for (const [lineIdStr, allocList] of Object.entries(groupedMap)) {
    const lineId    = parseInt(lineIdStr, 10);
    const productId = lineMap[lineId].product_id;

    for (const alloc of allocList) {
      const inv = await getWarehouseInventory(alloc.warehouse_id, productId);

      if (!inv) {
        const err = new Error(
          `Warehouse ${alloc.warehouse_id} has no inventory record for product ${productId}`
        );
        err.status = 400;
        throw err;
      }
      if (inv.available_quantity < alloc.quantity) {
        const err = new Error(
          `Warehouse ${alloc.warehouse_id} (${inv.warehouse_name}) only has ` +
          `${inv.available_quantity} units of product ${productId} ` +
          `but ${alloc.quantity} were requested`
        );
        err.status = 400;
        throw err;
      }
    }
  }

  // ── 6. Build allocationsByLine and commit inside a transaction ────────────
  const allocationsByLine = Object.entries(groupedMap).map(([lineIdStr, allocList]) => ({
    quote_line_id: parseInt(lineIdStr, 10),
    product_id:    lineMap[parseInt(lineIdStr, 10)].product_id,
    allocations:   allocList,
  }));

  await commitFulfillment(quoteId, allocationsByLine);

  return {
    quote_id: quoteId,
    message:  "Manual override accepted and inventory reserved",
    lines:    allocationsByLine,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET existing (accepted) fulfillment allocations for a quote
// ─────────────────────────────────────────────────────────────────────────────
async function getFulfillmentAllocations(quoteId) {
  // Confirm quote exists
  await getQuoteById(quoteId);

  const [rows] = await pool.query(
    `SELECT
       fa.id,
       fa.quote_line_id,
       fa.warehouse_id,
       w.name          AS warehouse_name,
       w.location      AS warehouse_location,
       fa.quantity_allocated,
       fa.shipping_cost,
       fa.status,
       fa.created_at,
       ql.product_id,
       p.name          AS product_name,
       p.sku           AS product_sku
     FROM fulfillment_allocations fa
     JOIN warehouses  w  ON w.id  = fa.warehouse_id
     JOIN quote_lines ql ON ql.id = fa.quote_line_id
     JOIN products    p  ON p.id  = ql.product_id
     WHERE fa.quote_id = ?
     ORDER BY fa.quote_line_id, fa.warehouse_id`,
    [quoteId]
  );
  return rows;
}

module.exports = {
  getFulfillmentSuggestion,
  acceptSuggestedFulfillment,
  manualOverrideFulfillment,
  getFulfillmentAllocations,
  // exported for unit-testing the pure algorithm
  allocate,
};
