const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const refreshToken = async (req, res) => {
  try {
    // 1. Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: "No refresh token found" 
      });
    }

    // 2. Verify the token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 3. Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // 4. Create new access token
    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    // 5. Create new refresh token (rotate)
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Store new refresh token (hashed)
    const hashedToken = crypto.createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");
    
    user.refreshToken = hashedToken;
    await user.save();

    // 7. Set new refresh token in cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 8. Return new access token
    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 900, // 15 minutes in seconds
    });

  } catch (error) {
    console.error("Refresh error:", error.message);

    // Clear the invalid cookie
    res.clearCookie("refreshToken");

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false, 
        message: "Refresh token expired. Please login again." 
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid refresh token" 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

module.exports = refreshToken;