-- ============================================================
-- DealFlow360 — Database Schema  (v3 — final)
-- Clean rebuild (safe to rerun):
--   mysql -u root -p < database/schema.sql
-- ============================================================

-- Drop and recreate for a clean, idempotent rebuild.
-- Indexes are attached to tables, so they are recreated too.
DROP DATABASE IF EXISTS dealflow360;
CREATE DATABASE dealflow360;
USE dealflow360;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'ADMIN',
        'SALES_REP',
        'SALES_MANAGER',
        'FINANCE',
        'CUSTOMER'
    ) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers
--    Added: phone VARCHAR(30)
CREATE TABLE IF NOT EXISTS customers (
    id    INT PRIMARY KEY AUTO_INCREMENT,
    name  VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30),
    tier ENUM('BRONZE', 'SILVER', 'GOLD') NOT NULL DEFAULT 'BRONZE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products
--    Added: sku VARCHAR(50) NOT NULL UNIQUE  (clean product identifier for frontend)
CREATE TABLE IF NOT EXISTS products (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    sku         VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    description TEXT,
    price       DECIMAL(12,2) NOT NULL,
    cost        DECIMAL(12,2) NOT NULL,
    billing_type ENUM('ONE_TIME', 'RECURRING') NOT NULL DEFAULT 'ONE_TIME',
    active      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Discount Rules
--    Added: UNIQUE(customer_tier, category) — prevents conflicting rules
CREATE TABLE IF NOT EXISTS discount_rules (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    customer_tier ENUM('BRONZE', 'SILVER', 'GOLD') NOT NULL,
    category      VARCHAR(100) NOT NULL,
    max_discount_percent DECIMAL(5,2) NOT NULL,
    approval_level ENUM(
        'NONE',
        'SALES_MANAGER',
        'FINANCE'
    ) NOT NULL DEFAULT 'NONE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (customer_tier, category)   -- ← prevents duplicate rules per tier+category
);

-- 5. Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    name                VARCHAR(150) NOT NULL,
    location            VARCHAR(255),
    shipping_cost_weight DECIMAL(10,2) DEFAULT 0,
    active              BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Inventory
--    Many-to-many: warehouse × product → available quantity
CREATE TABLE IF NOT EXISTS inventory (
    id                 INT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id       INT NOT NULL,
    product_id         INT NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0,

    CHECK (available_quantity >= 0),   -- ← no negative stock

    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (product_id)   REFERENCES products(id),

    UNIQUE (warehouse_id, product_id)
);

-- 7. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    name             VARCHAR(100) NOT NULL,
    billing_interval ENUM('MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL,
    price            DECIMAL(12,2) NOT NULL,
    proration_enabled BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Quotes  (central business entity)
--    Added: EXPIRED status, valid_until DATE, version INT
CREATE TABLE IF NOT EXISTS quotes (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    customer_id  INT NOT NULL,
    sales_rep_id INT NOT NULL,

    status ENUM(
        'DRAFT',
        'PENDING_MANAGER',
        'PENDING_FINANCE',
        'APPROVED',
        'REJECTED',
        'UNDER_NEGOTIATION',
        'CONFIRMED',
        'FULFILLING',
        'COMPLETED',
        'EXPIRED'              -- ← added
    ) NOT NULL DEFAULT 'DRAFT',

    subtotal       DECIMAL(12,2) DEFAULT 0,
    discount_total DECIMAL(12,2) DEFAULT 0,
    grand_total    DECIMAL(12,2) DEFAULT 0,
    margin         DECIMAL(12,2) DEFAULT 0,
    risk_score     DECIMAL(8,4)  DEFAULT 0,

    version     INT  NOT NULL DEFAULT 1,   -- ← increments on each negotiation round
    valid_until DATE NULL,                 -- ← expiry date shown on frontend

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)  REFERENCES customers(id),
    FOREIGN KEY (sales_rep_id) REFERENCES users(id)
);

-- 9. Quote Lines
CREATE TABLE IF NOT EXISTS quote_lines (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    quote_id         INT NOT NULL,
    product_id       INT NOT NULL,
    quantity         INT           NOT NULL,
    unit_price       DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2)  DEFAULT 0,
    discount_amount  DECIMAL(12,2) DEFAULT 0,
    line_total       DECIMAL(12,2) DEFAULT 0,
    margin           DECIMAL(12,2) DEFAULT 0,

    CHECK (quantity > 0),                                      -- ← no zero/negative qty
    CHECK (discount_percent >= 0 AND discount_percent <= 100), -- ← valid % range

    FOREIGN KEY (quote_id)   REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 10. Approvals  (sequential approval chain)
--     Added: updated_at for easy frontend status polling
CREATE TABLE IF NOT EXISTS approvals (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    quote_id        INT NOT NULL,
    approver_role   ENUM('SALES_MANAGER', 'FINANCE') NOT NULL,
    approver_id     INT NULL,
    sequence_number INT NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'REVISION_REQUESTED'
    ) DEFAULT 'PENDING',

    reason   TEXT,
    acted_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- ← added

    FOREIGN KEY (quote_id)    REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- 11. Approval Audit Logs  (immutable audit trail)
--     Added: previous_status + new_status columns for frontend timeline display
CREATE TABLE IF NOT EXISTS approval_audit_logs (
    id        INT PRIMARY KEY AUTO_INCREMENT,
    quote_id  INT NOT NULL,
    user_id   INT NOT NULL,

    action          VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),    -- ← e.g. 'DRAFT'
    new_status      VARCHAR(50),    -- ← e.g. 'PENDING_MANAGER'
    reason          TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)
);

-- 12. Fulfillment Allocations  (warehouse split suggestions)
CREATE TABLE IF NOT EXISTS fulfillment_allocations (
    id                 INT PRIMARY KEY AUTO_INCREMENT,
    quote_id           INT NOT NULL,
    quote_line_id      INT NOT NULL,
    warehouse_id       INT NOT NULL,
    quantity_allocated INT           NOT NULL,
    shipping_cost      DECIMAL(12,2) DEFAULT 0,

    CHECK (quantity_allocated > 0),   -- ← must allocate at least 1 unit

    status ENUM('SUGGESTED', 'ACCEPTED', 'BACKORDER') DEFAULT 'SUGGESTED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quote_id)      REFERENCES quotes(id)      ON DELETE CASCADE,
    FOREIGN KEY (quote_line_id) REFERENCES quote_lines(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id)  REFERENCES warehouses(id)
);

-- 13. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    quote_id          INT NOT NULL,
    quote_line_id     INT NOT NULL,
    customer_id       INT NOT NULL,
    plan_id           INT NOT NULL,
    start_date        DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    quantity          INT           NOT NULL DEFAULT 1,
    amount            DECIMAL(12,2) NOT NULL,

    status ENUM('ACTIVE', 'CANCELLED') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quote_id)      REFERENCES quotes(id),
    FOREIGN KEY (quote_line_id) REFERENCES quote_lines(id),
    FOREIGN KEY (customer_id)   REFERENCES customers(id),
    FOREIGN KEY (plan_id)       REFERENCES subscription_plans(id)
);

-- 14. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    quote_id     INT NOT NULL,
    customer_id  INT NOT NULL,
    invoice_type ENUM('ONE_TIME', 'RECURRING') NOT NULL,
    amount       DECIMAL(12,2) NOT NULL,
    status       ENUM('UNPAID', 'PAID', 'CANCELLED') DEFAULT 'UNPAID',
    due_date     DATE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quote_id)    REFERENCES quotes(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 15. Payments
CREATE TABLE IF NOT EXISTS payments (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id     INT NOT NULL,
    amount         DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    paid_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 16. Negotiations  (customer portal: comments, change requests, counter-discounts)
--     Added: requested_quantity, requested_unit_price, updated_at
CREATE TABLE IF NOT EXISTS negotiations (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    quote_id    INT NOT NULL,
    customer_id INT NOT NULL,
    line_id     INT NULL,

    request_type ENUM(
        'COMMENT',
        'CHANGE_REQUEST',
        'COUNTER_DISCOUNT'
    ) NOT NULL,

    requested_quantity   INT           NULL,  -- ← "I want 5 laptops instead of 3"
    requested_unit_price DECIMAL(12,2) NULL,  -- ← "Can you price it at 45000?"
    requested_discount   DECIMAL(5,2)  NULL,  -- ← "Can you give me 12% discount?"

    comment TEXT,

    status ENUM('OPEN', 'ACCEPTED', 'REJECTED') DEFAULT 'OPEN',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- ← added

    FOREIGN KEY (quote_id)    REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (line_id)     REFERENCES quote_lines(id)
);

-- ============================================================
-- Indexes  (added for common query patterns)
-- ============================================================

-- Quotes — frequently filtered by customer, sales rep, status
CREATE INDEX idx_quotes_customer   ON quotes(customer_id);
CREATE INDEX idx_quotes_sales_rep  ON quotes(sales_rep_id);
CREATE INDEX idx_quotes_status     ON quotes(status);

-- Approvals — always looked up by quote
CREATE INDEX idx_approvals_quote   ON approvals(quote_id);

-- Negotiations — always looked up by quote
CREATE INDEX idx_negotiations_quote ON negotiations(quote_id);

-- Inventory — queried by product and by warehouse
CREATE INDEX idx_inventory_product   ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);

-- ============================================================
-- Phase 10 — Upsell/Cross-Sell Rules (Task 38)
-- ============================================================

-- 17. Upsell Rules
--     Defines which products should be recommended when a specific product is in the quote
CREATE TABLE IF NOT EXISTS upsell_rules (
    id                    INT PRIMARY KEY AUTO_INCREMENT,
    product_id            INT NOT NULL COMMENT 'Product already in the quote',
    suggested_product_id  INT NOT NULL COMMENT 'Product to recommend',
    priority              INT NOT NULL DEFAULT 1 COMMENT 'Lower number = higher priority (1, 2, 3...)',
    promoted              BOOLEAN DEFAULT FALSE COMMENT 'Whether this is a promoted recommendation',
    min_margin            DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Minimum margin required for recommendation',
    active                BOOLEAN DEFAULT TRUE,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)           REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (suggested_product_id) REFERENCES products(id) ON DELETE CASCADE,

    UNIQUE KEY unique_rule (product_id, suggested_product_id),
    INDEX idx_product_lookup (product_id, active),
    INDEX idx_priority (priority)
) COMMENT='Task 38: Upsell and cross-sell recommendation rules';
