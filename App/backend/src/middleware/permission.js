const { hasPermission } = require("../utils/permissions");

module.exports = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: "Forbidden: Missing permission",
      });
    }

    next();
  };
};