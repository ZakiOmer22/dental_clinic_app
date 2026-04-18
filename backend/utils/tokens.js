const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      clinicId: user.clinic_id || user.clinicId,
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};