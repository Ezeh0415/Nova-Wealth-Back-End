// Generate secure reset token
const jwt = require("jsonwebtoken");
const generateResetToken = (userId, email) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 3600000; // 1 hour expiration

  // Create JWT with user info and expiration
  const resetToken = jwt.sign(
    {
      userId,
      email,
      token,
      type: "password_reset",
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1h" },
  );

  return {
    token: resetToken,
    plainToken: token, // Store this hashed in DB
    expires,
  };
};


module.exports = generateResetToken;