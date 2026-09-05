/**
 * authorizeRoles(...allowedRoles)
 *
 * RBAC middleware factory. Returns a middleware that checks req.user.role
 * against the allowed list. Must run AFTER authenticateToken so req.user exists.
 *
 * Usage examples:
 *   authorizeRoles("ADMIN")
 *   authorizeRoles("ADMIN", "SALES_MANAGER", "FINANCE")
 *
 * 401 — req.user missing  (authMiddleware didn't run or failed)
 * 403 — user is authenticated but their role isn't in allowedRoles
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Guard: authMiddleware must have run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
}

module.exports = authorizeRoles;
