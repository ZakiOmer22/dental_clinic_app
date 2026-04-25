const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔐 IMPORTANT: enforce token type
    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    req.user = {
      id: decoded.id,
      clinicId: decoded.clinicId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);

    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};