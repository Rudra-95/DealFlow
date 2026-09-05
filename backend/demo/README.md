# Phase 12 — Complete Backend Demo Flow

**Task 43: End-to-End Integration Testing**

This demo script proves that all backend phases (1-11) work together as one complete system.

## What This Tests

The demo executes the complete DealFlow360 business process:

```
LOGIN
  ↓
CREATE QUOTE
  ↓
ADD PRODUCTS
  ↓
APPLY DISCOUNT
  ↓
CALCULATE MARGIN
  ↓
CALCULATE RISK
  ↓
AUTO APPROVAL
  ↓
MANAGER APPROVAL
  ↓
FINANCE APPROVAL
  ↓
WAREHOUSE SPLIT
  ↓
CONFIRM ORDER
  ↓
GENERATE BILLING
  ↓
CUSTOMER NEGOTIATION
  ↓
RE-CALCULATE RISK
  ↓
RE-APPROVAL
  ↓
FINAL CONFIRMATION
  ↓
PAYMENT
```

## Prerequisites

1. **Backend server must be running:**
   ```bash
   cd ../
   node src/server.js
   ```

2. **Database must be populated with seed data:**
   - Users (sales rep, manager, finance, customer)
   - Products (laptop, support)
   - Warehouses with inventory
   - Discount rules
   - Upsell rules

## Installation

```bash
cd demo
npm install
```

## Running the Demo

```bash
npm run demo
```

Or directly:

```bash
node completeFlow.js
```

## Expected Output

The script will output each step with ✓ or ✗ indicators:

```
################################################################################
# DEALFLOW360 COMPLETE BACKEND DEMO FLOW
################################################################################

================================================================================
STEP 1: LOGIN (Sales Rep)
================================================================================
✓ Sales Rep authenticated
ℹ Token: eyJhbGciOiJIUzI1NiI...
ℹ User: John Sales (SALES_REP)

================================================================================
STEP 2: CREATE QUOTE
================================================================================
✓ Quote created
ℹ Quote ID: 42
ℹ Status: DRAFT
ℹ Customer ID: 1

... [continues through all 16 steps]

################################################################################
# DEMO FLOW COMPLETED SUCCESSFULLY ✓
################################################################################
✓ All backend phases integrated correctly
✓ Complete deal lifecycle verified
```

## What Gets Tested

### Phase 1-2: Authentication & Authorization
- Sales Rep login
- Manager login
- Finance login
- Customer portal login
- JWT token handling
- Role-based access control

### Phase 3: Product Catalog & Discount Rules
- Product retrieval
- Discount rule application

### Phase 4-6: Quote Management, Pricing, Risk & Approval
- Quote creation
- Quote line items
- Discount application
- Margin calculation
- Risk scoring
- Approval workflow (auto/manager/finance)

### Phase 7: Warehouse Fulfillment
- Fulfillment suggestion algorithm
- Warehouse allocation
- Inventory reservation
- Backorder calculation

### Phase 8: Hybrid Billing
- Order confirmation
- Invoice generation (ONE_TIME/RECURRING)
- Subscription creation
- Payment processing

### Phase 9: Customer Negotiation Portal
- Customer authentication
- Quote viewing (customer-safe data)
- Negotiation requests
- Re-approval workflow

### Phase 10: Upsell/Cross-Sell
- (Tested indirectly through quote flow)

### Phase 11: Dashboard & Deal Health
- (Tested indirectly through quote lifecycle)

## Validation

The script validates:

- ✓ All API responses return `success: true`
- ✓ Required fields exist in responses
- ✓ State transitions follow business rules
- ✓ Tokens are properly handled
- ✓ Multi-user workflow works correctly
- ✓ Approval chain functions properly
- ✓ Inventory is correctly reserved
- ✓ Billing is generated for confirmed orders
- ✓ Re-approval is triggered after negotiation
- ✓ Payment updates invoice status

## Troubleshooting

### "Connection refused"
- Backend server is not running
- Check port 5000 is available
- Verify API_BASE_URL in apiClient.js

### "Login failed"
- Database not seeded with test users
- Run `mysql dealflow360 < database/seed.sql`

### "Product not found"
- Database not seeded with products
- Verify products table has test data

### "Insufficient inventory"
- Warehouse inventory not seeded
- Check inventory table has stock

### "Validation failed"
- Response structure doesn't match expected format
- Check backend API responses match shared contract

## Configuration

Edit `helpers/apiClient.js` to change:

```javascript
const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";
```

## Files

```
demo/
├── completeFlow.js          # Main demo script (all 16 steps)
├── helpers/
│   ├── apiClient.js         # API wrapper with JWT handling
│   ├── logger.js            # Console output formatting
│   └── validator.js         # Response validation
├── package.json             # Dependencies
└── README.md                # This file
```

## Success Criteria

Phase 12 is complete when this script:

1. ✓ Runs without errors
2. ✓ All 16 steps complete successfully
3. ✓ Quote moves through all states correctly
4. ✓ Multi-level approval works
5. ✓ Fulfillment allocates inventory
6. ✓ Billing is generated correctly
7. ✓ Customer negotiation triggers re-approval
8. ✓ Payment completes the lifecycle

## Notes

- This is an **integration test**, not a unit test
- It tests the **complete business flow**, not individual functions
- It proves all backend phases **work together**
- It validates the **shared API contract** with frontend

This demo satisfies **Task 43: Create Complete Backend Demo Flow** from Phase 12.
