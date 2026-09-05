const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * TASK 34 — Customer Authentication Middleware
 * 
 * Restricted authentication for customer portal access.
 * Uses JWT tokens specifically issued for customer quotation access.
 * 
 * Token payload should contain:
 * {
 *   customer_id: number,
 *   quote_id: number,
 *   type: "CUSTOMER_PORTAL"
 * }
 * 
 * This middleware:
 * 1. Verifies the JWT token
 * 2. Validates it's a customer portal token
 * 3. Verifies the customer exists
 * 4. Verifies the quote belongs to the customer
 * 5. Populates req.customer with safe customer data
 * 
 * IMPORTANT: Does NOT expose internal cost, margin, or risk data
 */
async function authenticateCustomer(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Header must exist
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Customer authentication required",
    });
  }

  // 2. Must be "Bearer <token>"
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format. Use: Bearer <token>",
    });
  }

  // 3. Verify JWT signature + expiry
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Must be a customer portal token
    if (decoded.type !== "CUSTOMER_PORTAL") {
      return res.status(403).json({
        success: false,
        message: "Invalid token type. Customer portal access only.",
      });
    }

    // 5. Validate customer exists
    const [customerRows] = await pool.query(
      "SELECT id, name, email, tier FROM customers WHERE id = ?",
      [decoded.customer_id]
    );

    if (customerRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 6. Validate quote belongs to customer
    const [quoteRows] = await pool.query(
      "SELECT id, customer_id, status FROM quotes WHERE id = ? AND customer_id = ?",
      [decoded.quote_id, decoded.customer_id]
    );

    if (quoteRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Quote not found or access denied",
      });
    }

    // 7. Populate req.customer with SAFE data only
    // NO cost, margin, risk_score, or internal approval data
    req.customer = {
      id: customerRows[0].id,
      name: customerRows[0].name,
      email: customerRows[0].email,
      tier: customerRows[0].tier,
      quote_id: decoded.quote_id,
    };

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: err.message,
    });
  }
}

/**
 * Helper function to generate customer portal tokens
 * Should be called when sharing a quote with a customer
 */
function generateCustomerToken(customerId, quoteId, expiresIn = "30d") {
  return jwt.sign(
    {
      customer_id: customerId,
      quote_id: quoteId,
      type: "CUSTOMER_PORTAL",
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

module.exports = { authenticateCustomer, generateCustomerToken };
