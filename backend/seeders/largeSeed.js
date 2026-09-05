const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("../src/config/db");

// ─────────────────────────────────────────────────────────────────────────────
// LARGE DATASET SEEDER - 200-300+ Data Points
// ─────────────────────────────────────────────────────────────────────────────
// Use this when you need realistic volume of test data
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n################################################################################");
console.log("# DEALFLOW360 LARGE DATASET SEEDER");
console.log("################################################################################");
console.log("# Seeding 200-300+ records for realistic testing");
console.log("################################################################################\n");

async function seedLarge() {
  try {
    // Test connection
    await pool.query("SELECT 1");
    console.log("✓ Database connection successful\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 1. USERS (5 users - no need for more)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 5 users...");
    const password = await bcrypt.hash("password123", 10);

    await pool.query(`INSERT INTO users (name, email, password_hash, role) VALUES
      ('John Sales', 'sales@dealflow.com', ?, 'SALES_REP'),
      ('Sarah Manager', 'manager@dealflow.com', ?, 'SALES_MANAGER'),
      ('Robert Finance', 'finance@dealflow.com', ?, 'FINANCE'),
      ('Admin User', 'admin@dealflow.com', ?, 'ADMIN'),
      ('Customer Portal', 'customer@example.com', ?, 'CUSTOMER')`,
      [password, password, password, password, password]
    );
    console.log("✓ Inserted 5 users\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 2. CUSTOMERS (50 customers)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 50 customers...");
    const tiers = ['BRONZE', 'SILVER', 'GOLD'];
    const companyTypes = [
      'Corporation', 'Solutions', 'Inc', 'Pvt Ltd', 'Technologies', 
      'Systems', 'Group', 'Enterprises', 'Services', 'Industries'
    ];
    const businessNames = [
      'Tech', 'Digital', 'Global', 'Smart', 'Cloud', 'Data', 'Cyber',
      'Retail', 'Finance', 'Health', 'Education', 'Logistics', 'Manufacturing',
      'Consulting', 'Marketing', 'Real Estate', 'Food', 'Travel', 'Media', 'Energy'
    ];
    
    for (let i = 1; i <= 50; i++) {
      const businessName = businessNames[(i - 1) % businessNames.length];
      const companyType = companyTypes[(i - 1) % companyTypes.length];
      const companyName = `${businessName} ${companyType} ${i}`;
      const email = `contact${i}@${businessName.toLowerCase()}${i}.com`;
      const phone = `+91-98765${String(43210 + i).slice(-5)}`;
      const tier = tiers[(i - 1) % 3];
      
      await pool.query(
        `INSERT INTO customers (name, email, phone, tier) VALUES (?, ?, ?, ?)`,
        [companyName, email, phone, tier]
      );
    }
    console.log("✓ Inserted 50 customers\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 3. PRODUCTS (100 products)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 100 products...");
    const categories = ['HARDWARE', 'SOFTWARE', 'SERVICE'];
    const productTypes = {
      HARDWARE: ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Scanner', 'Webcam', 'Keyboard', 'Mouse', 'Headset', 'Docking Station'],
      SOFTWARE: ['Office Suite', 'Antivirus', 'Design Tool', 'Database', 'Analytics', 'CRM', 'ERP', 'Collaboration', 'Cloud Storage', 'VPN'],
      SERVICE: ['Support', 'Warranty', 'Training', 'Consulting', 'Maintenance', 'Installation', 'Migration', 'Backup', 'Security', 'Monitoring']
    };
    const brands = ['Dell', 'HP', 'Lenovo', 'Microsoft', 'Adobe', 'Oracle', 'SAP', 'Cisco', 'IBM', 'Apple'];
    
    for (let i = 1; i <= 100; i++) {
      const category = categories[(i - 1) % 3];
      const typeList = productTypes[category];
      const productType = typeList[(i - 1) % typeList.length];
      const brand = brands[(i - 1) % brands.length];
      
      const sku = `${category.substring(0, 3)}-${brand.substring(0, 3).toUpperCase()}-${String(i).padStart(4, '0')}`;
      const name = `${brand} ${productType} ${i}`;
      const description = `Professional ${productType.toLowerCase()} from ${brand} - Model ${i}`;
      
      // Price varies by category
      let basePrice;
      if (category === 'HARDWARE') {
        basePrice = 30000 + (i * 500); // 30k - 80k
      } else if (category === 'SOFTWARE') {
        basePrice = 500 + (i * 50); // 500 - 5.5k
      } else {
        basePrice = 2000 + (i * 100); // 2k - 12k
      }
      
      const price = basePrice.toFixed(2);
      const cost = (basePrice * 0.65).toFixed(2); // 35% margin
      const billingType = (category === 'HARDWARE') ? 'ONE_TIME' : ((i % 2 === 0) ? 'ONE_TIME' : 'RECURRING');
      
      await pool.query(
        `INSERT INTO products (sku, name, category, description, price, cost, billing_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sku, name, category, description, price, cost, billingType]
      );
    }
    console.log("✓ Inserted 100 products\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 4. WAREHOUSES (5 warehouses)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 5 warehouses...");
    await pool.query(`INSERT INTO warehouses (name, location, shipping_cost_weight) VALUES
      ('Mumbai Central Warehouse', 'Mumbai, Maharashtra', 1.0),
      ('Delhi North Warehouse', 'Delhi, Delhi', 1.2),
      ('Bangalore Tech Hub', 'Bangalore, Karnataka', 1.3),
      ('Kolkata East Warehouse', 'Kolkata, West Bengal', 1.5),
      ('Chennai South Warehouse', 'Chennai, Tamil Nadu', 1.4)`
    );
    console.log("✓ Inserted 5 warehouses\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 5. INVENTORY (500 records: 100 products × 5 warehouses)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 500 inventory records (this may take a moment)...");
    const inventoryBatch = [];
    
    for (let warehouseId = 1; warehouseId <= 5; warehouseId++) {
      for (let productId = 1; productId <= 100; productId++) {
        // Random quantity between 10-100 for hardware, 50-200 for software/services
        const isHardware = ((productId - 1) % 3) === 0;
        const minQty = isHardware ? 10 : 50;
        const maxQty = isHardware ? 100 : 200;
        const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
        
        inventoryBatch.push([warehouseId, productId, quantity]);
      }
    }
    
    // Batch insert for performance
    for (let i = 0; i < inventoryBatch.length; i += 50) {
      const batch = inventoryBatch.slice(i, i + 50);
      const values = batch.map(() => '(?, ?, ?)').join(',');
      const params = batch.flat();
      
      await pool.query(
        `INSERT INTO inventory (warehouse_id, product_id, available_quantity) VALUES ${values}`,
        params
      );
    }
    console.log("✓ Inserted 500 inventory records\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 6. DISCOUNT RULES (9 rules covering all tier-category combinations)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 9 discount rules...");
    await pool.query(`INSERT INTO discount_rules (customer_tier, category, max_discount_percent, approval_level) VALUES
      ('BRONZE', 'HARDWARE', 10.00, 'NONE'),
      ('BRONZE', 'SOFTWARE', 5.00, 'NONE'),
      ('BRONZE', 'SERVICE', 8.00, 'NONE'),
      ('SILVER', 'HARDWARE', 15.00, 'SALES_MANAGER'),
      ('SILVER', 'SOFTWARE', 12.00, 'SALES_MANAGER'),
      ('SILVER', 'SERVICE', 10.00, 'NONE'),
      ('GOLD', 'HARDWARE', 20.00, 'FINANCE'),
      ('GOLD', 'SOFTWARE', 18.00, 'SALES_MANAGER'),
      ('GOLD', 'SERVICE', 15.00, 'SALES_MANAGER')`
    );
    console.log("✓ Inserted 9 discount rules\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 7. SUBSCRIPTION PLANS (6 plans - Monthly/Quarterly/Yearly × Basic/Premium)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 6 subscription plans...");
    await pool.query(`INSERT INTO subscription_plans (name, billing_interval, price, proration_enabled) VALUES
      ('Basic Monthly Plan', 'MONTHLY', 5000.00, TRUE),
      ('Premium Monthly Plan', 'MONTHLY', 10000.00, TRUE),
      ('Basic Quarterly Plan', 'QUARTERLY', 14000.00, TRUE),
      ('Premium Quarterly Plan', 'QUARTERLY', 28000.00, TRUE),
      ('Basic Yearly Plan', 'YEARLY', 50000.00, TRUE),
      ('Premium Yearly Plan', 'YEARLY', 100000.00, TRUE)`
    );
    console.log("✓ Inserted 6 subscription plans\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 8. UPSELL RULES (50 rules - product recommendations)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 50 upsell rules...");
    
    // Create smart upsell rules based on product relationships
    for (let i = 1; i <= 50; i++) {
      const productId = i;
      const productCategory = ((productId - 1) % 3);
      
      // Determine suggested products based on category
      let suggestedProductId;
      let priority;
      let promoted;
      let minMargin;
      
      if (productCategory === 0) { // HARDWARE
        // Suggest SOFTWARE or SERVICE
        suggestedProductId = productId + 1; // Next product (likely SOFTWARE)
        priority = 1;
        promoted = (i % 3 === 0); // Every 3rd is promoted
        minMargin = 10.0;
      } else if (productCategory === 1) { // SOFTWARE
        // Suggest SERVICE or related SOFTWARE
        suggestedProductId = productId + 2; // Skip to SERVICE
        priority = 2;
        promoted = (i % 4 === 0); // Every 4th is promoted
        minMargin = 8.0;
      } else { // SERVICE
        // Suggest HARDWARE or premium SERVICE
        suggestedProductId = ((productId + 10) % 100) + 1; // Jump to different product
        priority = 3;
        promoted = (i % 5 === 0); // Every 5th is promoted
        minMargin = 12.0;
      }
      
      // Ensure suggested product exists (1-100)
      if (suggestedProductId > 100) {
        suggestedProductId = suggestedProductId % 100;
      }
      if (suggestedProductId < 1) {
        suggestedProductId = 1;
      }
      
      // Don't suggest the same product
      if (suggestedProductId === productId) {
        suggestedProductId = (productId % 100) + 1;
      }
      
      await pool.query(
        `INSERT INTO upsell_rules (product_id, suggested_product_id, priority, promoted, min_margin, active) 
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [productId, suggestedProductId, priority, promoted ? 1 : 0, minMargin]
      );
    }
    console.log("✓ Inserted 50 upsell rules\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 9. QUOTES (200 quotes)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 200 quotes...");
    const statuses = ['DRAFT', 'PENDING_MANAGER', 'PENDING_FINANCE', 'APPROVED', 'REJECTED', 'CONFIRMED', 'UNDER_NEGOTIATION'];
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    for (let i = 1; i <= 200; i++) {
      const customerId = ((i - 1) % 50) + 1; // Cycle through 50 customers
      const salesRepId = 1; // John Sales
      const status = statuses[(i - 1) % statuses.length];
      
      // Generate realistic quote values
      const baseAmount = 50000 + (i * 2500);
      const subtotal = baseAmount.toFixed(2);
      
      // Discount varies by customer tier and status
      let discountPercent = 0;
      if (status === 'APPROVED' || status === 'CONFIRMED') {
        discountPercent = 5 + Math.floor(Math.random() * 10); // 5-15%
      } else if (status === 'PENDING_MANAGER') {
        discountPercent = 10 + Math.floor(Math.random() * 10); // 10-20%
      } else if (status === 'PENDING_FINANCE') {
        discountPercent = 15 + Math.floor(Math.random() * 10); // 15-25%
      } else {
        discountPercent = Math.floor(Math.random() * 20); // 0-20%
      }
      
      const discountTotal = (subtotal * discountPercent / 100).toFixed(2);
      const grandTotal = (subtotal - discountTotal).toFixed(2);
      const margin = (grandTotal * 0.25).toFixed(2); // 25% margin
      const riskScore = (discountPercent * 2 + Math.random() * 20).toFixed(2); // Higher discount = higher risk
      
      const month = months[(i - 1) % 12];
      const day = String(10 + ((i - 1) % 18)).padStart(2, '0'); // Days 10-27
      const validUntil = `2026-${month}-${day}`;
      
      await pool.query(
        `INSERT INTO quotes (id, customer_id, sales_rep_id, status, subtotal, discount_total, grand_total, margin, risk_score, valid_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [i, customerId, salesRepId, status, subtotal, discountTotal, grandTotal, margin, riskScore, validUntil]
      );
    }
    console.log("✓ Inserted 200 quotes\n");

    // ═════════════════════════════════════════════════════════════════════════
    // 10. QUOTE LINES (500 lines: avg 2-3 products per quote)
    // ═════════════════════════════════════════════════════════════════════════
    console.log("Seeding 500 quote lines...");
    let lineCount = 0;
    
    for (let quoteId = 1; quoteId <= 200; quoteId++) {
      // Each quote gets 2-3 random products
      const numProducts = (quoteId % 2 === 0) ? 3 : 2;
      
      for (let j = 0; j < numProducts; j++) {
        lineCount++;
        const productId = Math.floor(Math.random() * 100) + 1;
        const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units
        
        // Get product price based on ID (matches product seeding logic)
        const productCategory = ((productId - 1) % 3);
        let basePrice;
        if (productCategory === 0) { // HARDWARE
          basePrice = 30000 + (productId * 500);
        } else if (productCategory === 1) { // SOFTWARE
          basePrice = 500 + (productId * 50);
        } else { // SERVICE
          basePrice = 2000 + (productId * 100);
        }
        
        const unitPrice = basePrice.toFixed(2);
        const discountPercent = Math.floor(Math.random() * 15); // 0-15%
        const lineSubtotal = unitPrice * quantity;
        const discountAmount = (lineSubtotal * discountPercent / 100).toFixed(2);
        const lineTotal = (lineSubtotal - discountAmount).toFixed(2);
        const margin = (lineTotal * 0.25).toFixed(2);
        
        await pool.query(
          `INSERT INTO quote_lines (quote_id, product_id, quantity, unit_price, discount_percent, discount_amount, line_total, margin)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [quoteId, productId, quantity, unitPrice, discountPercent, discountAmount, lineTotal, margin]
        );
      }
    }
    console.log(`✓ Inserted ${lineCount} quote lines\n`);

    // ═════════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═════════════════════════════════════════════════════════════════════════
    console.log("################################################################################");
    console.log("# SEEDING COMPLETED SUCCESSFULLY ✓");
    console.log("################################################################################\n");
    
    console.log("📊 Data Summary:");
    console.log("  ├─ 5 users");
    console.log("  ├─ 50 customers");
    console.log("  ├─ 100 products");
    console.log("  ├─ 5 warehouses");
    console.log("  ├─ 500 inventory records");
    console.log("  ├─ 9 discount rules");
    console.log("  ├─ 6 subscription plans");
    console.log("  ├─ 50 upsell rules");
    console.log("  ├─ 200 quotes");
    console.log("  └─ 500 quote lines");
    console.log("\n  📈 Total Records: 1,425");
    console.log("\n🔑 Test Credentials:");
    console.log("  Sales Rep:  sales@dealflow.com / password123");
    console.log("  Manager:    manager@dealflow.com / password123");
    console.log("  Finance:    finance@dealflow.com / password123");
    console.log("  Admin:      admin@dealflow.com / password123");
    console.log("  Customer:   customer@example.com / password123\n");

    process.exit(0);
  } catch (error) {
    console.error("\n################################################################################");
    console.error("# SEEDING FAILED ✗");
    console.error("################################################################################\n");
    console.error("Error:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

seedLarge();
