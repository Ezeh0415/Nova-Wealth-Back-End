const bcrypt = require("bcryptjs");
const WalletModel = require("../../Models/WalletSchema");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../middlewares/JWT-Token");

class SignUpController {
  constructor(SignUpService) {
    this.SignUpService = SignUpService;

    this.signUp = this.signUp.bind(this);
  }

  async signUp(req, res) {
    try {
      const { fullName, userName, email, password } = req.body;

      // 1️⃣ Validate fields
      if (!fullName || !userName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // 2️⃣ Check if user exists
      const existingUser = await this.SignUpService.checkUserExist(email);

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // 3️⃣ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4️⃣ Create user
      const user = await this.SignUpService.signUp({
        fullName,
        userName,
        email,
        password: hashedPassword,
        role: "admin",
        KycStatus: "verified",
        referralCode: email,
        referralLink: email,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // 5️⃣ Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // 6️⃣ Set refresh token in HttpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // 8️⃣ Return sanitized user
      const { password: _, refreshToken: __, ...safeUser } = user.toObject();

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: safeUser,
        accessToken,
      });
    } catch (err) {
      console.error("SignUpController Error:", err);
      return res
        .status(500)
        .json({ message: `Server error${err} ${err.message}` });
    }
  }
}

module.exports = SignUpController;
