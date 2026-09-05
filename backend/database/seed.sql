-- ============================================================
-- DealFlow360 — Seed Data  (v2 — idempotent)
-- Run AFTER schema.sql:
--   mysql -u root -p dealflow360 < database/seed.sql
-- Safe to rerun — uses ON DUPLICATE KEY UPDATE throughout.
-- ============================================================

-- NOTE: Users are NOT seeded here.
-- Create them via POST /api/auth/register after the server is running,
-- so bcrypt password hashing is applied correctly.
-- Recommended demo accounts:
--   admin@dealflow.com     role: ADMIN
--   sales@dealflow.com     role: SALES_REP
--   manager@dealflow.com   role: SALES_MANAGER
--   finance@dealflow.com   role: FINANCE
--   customer@acme.com      role: CUSTOMER

-- ── Customers ─────────────────────────────────────────────────
INSERT INTO customers (name, email, phone, tier)
VALUES
  ('Acme Corporation', 'acme@example.com',  '+91-9000000001', 'GOLD'),
  ('Beta Industries',  'beta@example.com',  '+91-9000000002', 'SILVER'),
  ('Gamma Solutions',  'gamma@example.com', '+91-9000000003', 'BRONZE')
ON DUPLICATE KEY UPDATE
  name  = VALUES(name),
  phone = VALUES(phone),
  tier  = VALUES(tier);

-- ── Products ──────────────────────────────────────────────────
INSERT INTO products (sku, name, category, description, price, cost, billing_type)
VALUES
  ('LAP-001', 'Business Laptop',    'Hardware',     'Enterprise-grade laptop',             50000, 38000, 'ONE_TIME'),
  ('SET-001', 'Setup Service',      'Service',      'Professional on-site setup',          10000,  7000, 'ONE_TIME'),
  ('SUP-001', 'Premium Support',    'Service',      'Priority support 24x7',                5000,  2500, 'ONE_TIME'),
  ('CLD-001', 'Cloud Subscription', 'Subscription', 'Monthly cloud platform subscription',  3000,  1000, 'RECURRING')
ON DUPLICATE KEY UPDATE
  name         = VALUES(name),
  category     = VALUES(category),
  description  = VALUES(description),
  price        = VALUES(price),
  cost         = VALUES(cost),
  billing_type = VALUES(billing_type);

-- ── Discount Rules ────────────────────────────────────────────
-- Demo scenario: Gold customer + Service + 12% discount
--   → max allowed = 10% → 2% over limit → approval triggered
INSERT INTO discount_rules (customer_tier, category, max_discount_percent, approval_level)
VALUES
  ('BRONZE', 'Hardware',  5,  'SALES_MANAGER'),
  ('BRONZE', 'Service',   5,  'SALES_MANAGER'),
  ('SILVER', 'Hardware', 10,  'SALES_MANAGER'),
  ('SILVER', 'Service',   8,  'SALES_MANAGER'),
  ('GOLD',   'Hardware', 15,  'SALES_MANAGER'),
  ('GOLD',   'Service',  10,  'SALES_MANAGER')
ON DUPLICATE KEY UPDATE
  max_discount_percent = VALUES(max_discount_percent),
  approval_level       = VALUES(approval_level);

-- ── Warehouses ────────────────────────────────────────────────
INSERT INTO warehouses (name, location, shipping_cost_weight)
VALUES
  ('Main Warehouse',  'Ahmedabad',   100),
  ('East Warehouse',  'Vadodara',     80),
  ('North Warehouse', 'Gandhinagar', 120)
ON DUPLICATE KEY UPDATE
  location             = VALUES(location),
  shipping_cost_weight = VALUES(shipping_cost_weight);

-- ── Inventory ─────────────────────────────────────────────────
-- Uses SKU + warehouse name lookups instead of hardcoded IDs,
-- so this is safe regardless of auto-increment state.
-- Demo: customer orders 5 laptops → Main (3) + East (2) split.

INSERT INTO inventory (warehouse_id, product_id, available_quantity)
SELECT w.id, p.id, 3
FROM warehouses w CROSS JOIN products p
WHERE w.name = 'Main Warehouse'  AND p.sku = 'LAP-001'
ON DUPLICATE KEY UPDATE available_quantity = VALUES(available_quantity);

INSERT INTO inventory (warehouse_id, product_id, available_quantity)
SELECT w.id, p.id, 4
FROM warehouses w CROSS JOIN products p
WHERE w.name = 'East Warehouse'  AND p.sku = 'LAP-001'
ON DUPLICATE KEY UPDATE available_quantity = VALUES(available_quantity);

INSERT INTO inventory (warehouse_id, product_id, available_quantity)
SELECT w.id, p.id, 10
FROM warehouses w CROSS JOIN products p
WHERE w.name = 'North Warehouse' AND p.sku = 'LAP-001'
ON DUPLICATE KEY UPDATE available_quantity = VALUES(available_quantity);


-- ── Subscription Plans ────────────────────────────────────────
INSERT INTO subscription_plans (name, billing_interval, price, proration_enabled)
VALUES
  ('Monthly Support',   'MONTHLY',    3000, TRUE),
  ('Quarterly Support', 'QUARTERLY',  8500, TRUE),
  ('Annual Support',    'YEARLY',    30000, TRUE)
ON DUPLICATE KEY UPDATE
  price             = VALUES(price),
  proration_enabled = VALUES(proration_enabled);
