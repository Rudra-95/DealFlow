const jwt = require("jsonwebtoken");

/**
 * authenticateToken
 *
 * Reads the Authorization header, verifies the JWT, and populates req.user.
 * Use this on every route that requires a logged-in user.
 *
 * On success  → calls next()       (req.user is set)
 * On failure  → 401 Unauthorized
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Header must exist
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
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

  // 3. Verify signature + expiry
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded = { id, email, role, iat, exp }
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

module.exports = authenticateToken;
