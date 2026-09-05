# Database Seeder

## Overview

The seeder populates the DealFlow360 database with test data. Two versions available:

1. **Simple Seeder** (`npm run seed`) - Small dataset for quick testing
2. **Large Seeder** (`npm run seed:large`) - 200-300+ records for realistic testing

## Commands

### Small Dataset (Quick Testing)

```bash
npm run seed
```

**Seeds:**
- 5 users
- 3 customers
- 5 products
- 3 warehouses
- 9 inventory records
- 4 discount rules
- 3 quotes
- 4 quote lines

**Total: ~35 records**

---

### Large Dataset (Realistic Testing)

```bash
npm run seed:large
```

**Seeds:**
- 5 users
- 50 customers
- 100 products
- 5 warehouses
- 500 inventory records (all products in all warehouses)
- 9 discount rules
- 200 quotes (various states)
- 500 quote lines (2-3 products per quote)

**Total: 1,369 records**

---

## Prerequisites

1. **Database schema must be created first:**
   ```bash
   mysql -u root -p
   source C:/Users/Kavya/OneDrive/Desktop/DealFlow/backend/database/schema.sql;
   exit;
   ```

2. **Environment variables configured in `.env`:**
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=dealflow360
   ```

---

## Usage Scenarios

### Scenario 1: First Time Setup (Use Small)
```bash
mysql -u root -p
source schema.sql;
exit;

npm run seed
npm start
```

### Scenario 2: Demo for Stakeholders (Use Large)
```bash
mysql -u root -p
source schema.sql;
exit;

npm run seed:large
npm start
```

### Scenario 3: Reset and Reseed
```bash
mysql -u root -p
source schema.sql;
exit;

npm run seed:large
npm start
```

---

## User Credentials

All seeded users have password: `password123`

| Email | Role | Purpose |
|-------|------|---------|
| sales@dealflow.com | SALES_REP | Create and manage quotes |
| manager@dealflow.com | SALES_MANAGER | Approve quotes |
| finance@dealflow.com | FINANCE | Final approval for high-risk deals |
| admin@dealflow.com | ADMIN | System administration |
| customer@example.com | CUSTOMER | Customer portal access |

---

## What Gets Seeded

### Simple Seeder (`npm run seed`)

**Perfect for:** Quick testing, development, frontend integration

- **Users:** 5 test accounts (sales, manager, finance, admin, customer)
- **Customers:** 3 companies (Acme, TechCorp, Global Inc)
- **Products:** 5 products (2 laptops, 1 monitor, 1 support, 1 office365)
- **Warehouses:** 3 locations (Mumbai, Kolkata, Delhi)
- **Inventory:** 9 records (products distributed across warehouses)
- **Quotes:** 3 quotes (APPROVED, PENDING_MANAGER, DRAFT)

### Large Seeder (`npm run seed:large`)

**Perfect for:** Presentations, performance testing, realistic demos

- **Users:** Same 5 test accounts
- **Customers:** 50 companies with varied names
- **Products:** 100 products across HARDWARE, SOFTWARE, SERVICE categories
  - Dell, HP, Lenovo, Microsoft, Adobe, Oracle, SAP, Cisco, IBM, Apple brands
  - Price ranges: Hardware (₹30k-80k), Software (₹500-5.5k), Service (₹2k-12k)
- **Warehouses:** 5 locations (Mumbai, Delhi, Bangalore, Kolkata, Chennai)
- **Inventory:** 500 records (every product in every warehouse)
  - Hardware: 10-100 units per warehouse
  - Software/Service: 50-200 units per warehouse
- **Discount Rules:** 9 rules covering all tier-category combinations
- **Quotes:** 200 quotes in various states
  - DRAFT, PENDING_MANAGER, PENDING_FINANCE, APPROVED, REJECTED, CONFIRMED, UNDER_NEGOTIATION
  - Realistic amounts (₹50k-₹550k)
  - Risk scores correlated with discount levels
- **Quote Lines:** 500 lines (2-3 products per quote)

---

## Sample Data Patterns (Large Seeder)

### Customers
- Realistic company names: "Tech Corporation 1", "Digital Solutions 5", "Cloud Enterprises 12"
- Emails: contact1@tech1.com, contact2@digital2.com, etc.
- Phone numbers: +91-98765XXXXX
- Tiers: Distributed across BRONZE, SILVER, GOLD

### Products
- SKUs: HAR-DEL-0001, SOF-MIC-0045, SER-CIS-0089
- Names: "Dell Laptop 1", "Microsoft Design Tool 45", "Cisco Monitoring 89"
- Categories: HARDWARE (33%), SOFTWARE (33%), SERVICE (33%)
- Billing: Hardware = ONE_TIME, Software/Service = mixed

### Quotes
- Spread across all 12 months of 2026
- Customers cycle through (Quote 1 → Customer 1, Quote 51 → Customer 1 again)
- Status distribution matches realistic workflow
- Higher discounts = higher risk scores

### Inventory
- Every product available in every warehouse
- Hardware: Lower quantities (realistic for expensive items)
- Software/Services: Higher quantities (digital goods)

---

## Troubleshooting

### "Unknown database 'dealflow360'"
**Solution:** Run schema.sql first
```bash
mysql -u root -p < database/schema.sql
```

### "Duplicate entry for key"
**Solution:** Database already has data. Reset it:
```bash
mysql -u root -p < database/schema.sql
npm run seed:large
```

### "Connection refused"
**Solution:** Check MySQL is running and credentials in `.env` are correct

### Seeder is slow
**Solution:** This is normal for large seeder (500 inventory records take time). Wait 30-60 seconds.

---

## Performance

| Seeder | Records | Time | Use Case |
|--------|---------|------|----------|
| Simple | ~35 | 2-3 sec | Quick dev/testing |
| Large | 1,369 | 30-60 sec | Demos, realistic testing |

---

## File Structure

```
seeders/
├── simpleSeed.js          ← Small dataset (npm run seed)
├── largeSeed.js           ← Large dataset (npm run seed:large)
└── README.md              ← This file
```

---

## Verification

After seeding, verify data:

```sql
mysql -u root -p
USE dealflow360;

-- Check counts
SELECT COUNT(*) FROM users;          -- Should show 5
SELECT COUNT(*) FROM customers;      -- Simple: 3, Large: 50
SELECT COUNT(*) FROM products;       -- Simple: 5, Large: 100
SELECT COUNT(*) FROM quotes;         -- Simple: 3, Large: 200
SELECT COUNT(*) FROM quote_lines;    -- Simple: 4, Large: 500

-- Check sample data
SELECT * FROM products LIMIT 10;
SELECT * FROM quotes WHERE status = 'PENDING_MANAGER';
SELECT * FROM customers WHERE tier = 'GOLD';
```

---

## When to Use Which Seeder

| Situation | Seeder to Use |
|-----------|---------------|
| Local development | `npm run seed` (simple) |
| Frontend integration testing | `npm run seed` (simple) |
| API testing | `npm run seed` (simple) |
| Demo to professor/stakeholders | `npm run seed:large` |
| Performance testing | `npm run seed:large` |
| Screenshot for documentation | `npm run seed:large` |
| Showing realistic dashboard | `npm run seed:large` |

---

## Notes

- **Passwords:** All users use `password123` (hashed with bcrypt)
- **Data Persistence:** Data stays in MySQL until you reseed
- **Foreign Keys:** Seeding order respects foreign key constraints
- **IDs:** Auto-incremented by MySQL
- **Randomness:** Large seeder uses controlled randomness for realistic variation

---

## Integration with Demo Flow

Both seeders work with Phase 12 demo (`demo/completeFlow.js`):
- Demo uses seeded users for authentication
- Demo creates NEW quotes (doesn't modify seeded quotes)
- Demo tests with seeded products
- Demo allocates from seeded inventory

Run demo after seeding:
```bash
npm run seed:large
npm start

# In another terminal:
cd demo
npm install
npm run demo
```

## Data Seeded

- **8 Users** (sales reps, managers, finance, admin, customers)
- **5 Customers** (companies with contact info)
- **10 Products** (laptops, software, services - ONE_TIME and RECURRING)
- **4 Warehouses** (Mumbai, Kolkata, Delhi, Bangalore)
- **16 Inventory Records** (products distributed across warehouses)
- **4 Discount Rules** (tiered by customer level and category)
- **13 Upsell Rules** (product recommendations based on purchase)
- **7 Quotes** (various states: DRAFT, PENDING, APPROVED, CONFIRMED, REJECTED)
- **17 Quote Lines** (line items for all quotes)
- **5 Approvals** (manager/finance approval records)
- **1 Order** (confirmed order from Quote 5)
- **3 Invoices** (ONE_TIME and RECURRING billing)
- **2 Subscriptions** (active monthly subscriptions)
- **1 Payment** (paid invoice)

## Commands

### Seed Data (Additive)

```bash
npm run seed
```

Adds data to existing tables. Use this when database already has schema but needs test data.

### Reset and Seed (Destructive)

```bash
npm run seed:reset
```

**⚠️ WARNING: This deletes ALL existing data first**, then seeds fresh data. Only use in development.

## Prerequisites

1. Database schema must be created first:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

2. Environment variables must be configured in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=dealflow360
   ```

## User Credentials

All seeded users have the password: `password123` (hashed with bcrypt)

### Internal Users

| Email | Role | Purpose |
|-------|------|---------|
| sales@dealflow.com | SALES_REP | Create and manage quotes |
| manager@dealflow.com | SALES_MANAGER | Approve quotes |
| finance@dealflow.com | FINANCE | Final approval for high-risk deals |
| admin@dealflow.com | ADMIN | System administration |

### Customer Portal Users

| Email | Role | Company |
|-------|------|---------|
| customer@example.com | CUSTOMER | Acme Corporation |
| emma@techcorp.com | CUSTOMER | TechCorp Solutions |
| michael@globalinc.com | CUSTOMER | Global Inc |

## Sample Data Scenarios

The seeded data includes realistic scenarios for testing:

### Quote 1 (APPROVED)
- Customer: Acme Corporation
- Products: 5 Dell Laptops + Support + Monitors
- Discount: 8%
- Status: Approved, ready for fulfillment

### Quote 2 (PENDING_MANAGER)
- Customer: TechCorp Solutions
- Products: 10 HP ProBooks + Office 365 + Warranty
- Discount: 15%
- Status: Waiting for manager approval

### Quote 3 (PENDING_FINANCE)
- Customer: Global Inc
- Products: 15 Lenovo X1 + Premium Support + Cloud Storage
- Discount: 22%
- Status: Manager approved, waiting for finance

### Quote 4 (DRAFT)
- Customer: Startup Ventures
- Products: 3 Dell Laptops + Basic Support
- Discount: 5%
- Status: Still being created

### Quote 5 (CONFIRMED - Has Order)
- Customer: Kumar Enterprises
- Products: 8 HP ProBooks + Office 365 + Premium Support
- Discount: 12%
- Status: Confirmed order with invoices and subscriptions

### Quote 6 (REJECTED)
- Customer: TechCorp Solutions
- Products: 20 Lenovo X1 laptops
- Discount: 35%
- Status: Rejected by finance (margin too low)

### Quote 7 (STALLED)
- Customer: Acme Corporation
- Products: 2 Dell Laptops
- Discount: 10%
- Status: Draft for > 3 days (stalled deal)

## Troubleshooting

### "Connection refused"
- MySQL server is not running
- Check DB credentials in `.env`

### "Database doesn't exist"
- Run schema.sql first: `mysql -u root -p < database/schema.sql`

### "Table doesn't exist"
- Schema not created
- Run `mysql -u root -p < database/schema.sql`

### "Duplicate entry"
- Data already exists
- Use `npm run seed:reset` to clear and reseed

### "Foreign key constraint fails"
- Seeding order is wrong (should not happen with current implementation)
- Use `npm run seed:reset` to clear and reseed properly

## File Structure

```
seeders/
├── seed.js                    # Main seeder script
├── data/
│   ├── users.js              # 8 users
│   ├── customers.js          # 5 customers
│   ├── products.js           # 10 products
│   ├── warehouses.js         # 4 warehouses
│   ├── inventory.js          # 16 inventory records
│   ├── discountRules.js      # 4 discount rules
│   ├── upsellRules.js        # 13 upsell rules
│   ├── quotes.js             # 7 quotes
│   ├── quoteLines.js         # 17 quote lines
│   ├── approvals.js          # 5 approval records
│   ├── orders.js             # 1 order
│   ├── invoices.js           # 3 invoices
│   ├── subscriptions.js      # 2 subscriptions
│   └── payments.js           # 1 payment
└── README.md                  # This file
```

## Development Notes

- Seeder is **development-only** - never run in production
- All passwords are hashed with bcrypt (10 rounds)
- Foreign key constraints are respected (parent records created before children)
- IDs are auto-incremented by MySQL
- Timestamps are set to NOW() during seeding

## Integration with Demo Flow

The seeded data is designed to work with the Phase 12 demo flow (`demo/completeFlow.js`):

1. Demo creates new quotes using seeded users
2. Demo adds products from seeded product catalog
3. Demo tests approval workflow with seeded managers/finance
4. Demo allocates from seeded warehouse inventory
5. Demo generates billing for seeded customers

Both seeder and demo can be run independently or together for complete system testing.
