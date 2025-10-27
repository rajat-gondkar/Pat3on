/**
 * Middleware to check if user has required role(s)
 * Usage: roleCheck('author') or roleCheck(['user', 'author'])
 */
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const roles = allowedRoles.flat(); // Flatten array in case array is passed

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${userRole}`
      });
    }

    next();
  };
};

module.exports = roleCheck;
