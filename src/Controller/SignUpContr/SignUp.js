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

      if (fullName.length < 3 || fullName.length > 50) {
        return res
          .status(400)
          .json({ message: "Full name must be between 3 and 50 characters" });
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

      // verify captcha

      // 2️⃣ Check if user exists
      const existingUser = await this.SignUpService.checkUserExist(
        userName,
        email,
      );

      if (existingUser) {
        if (existingUser.userName === userName) {
          return res.status(400).json({ message: "Username already exists" });
        }
        if (existingUser.email === email) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // 3️⃣ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Log reCAPTCHA score if available
      if (req.recaptchaData) {
        console.log(
          `📊 Signup with reCAPTCHA score: ${req.recaptchaData.score}`,
        );
      }

      
      // 4️⃣ Create user
      const user = await this.SignUpService.signUp({
        fullName,
        userName,
        email,
        password: hashedPassword,
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

      // 7️⃣ Automatically create wallet
      await WalletModel.create({
        userId: user._id,
        balance: 0,
      });

      // 8️⃣ Return sanitized user
      const { password: _, refreshToken: __, ...safeUser } = user.toObject();

      return res.status(201).json({
        message: "User created successfully",
        data: safeUser,
        accessToken,
      });
    } catch (err) {
      console.error("SignUpController Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = SignUpController;
