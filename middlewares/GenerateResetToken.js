const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateResetToken = (userId, email) => {
  try {
    // Generate random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour

    // Create JWT
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
  } catch (error) {
    console.error("Error generating reset token:", error);
    throw new Error("Failed to generate reset token");
  }
};

module.exports = generateResetToken;
