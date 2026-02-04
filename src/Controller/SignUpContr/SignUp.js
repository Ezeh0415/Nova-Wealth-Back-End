const bcrypt = require("bcryptjs");
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
      const { fullName, userName, email, password, referral } = req.body;

      // 3️⃣ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // // Log reCAPTCHA score if available
      // if (req.recaptchaData) {
      //   console.log(
      //     `📊 Signup with reCAPTCHA score: ${req.recaptchaData.score}`,
      //   );
      // }

      // 4️⃣ Create user
      const user = await this.SignUpService.signUp({
        fullName,
        userName,
        email,
        password: hashedPassword,
        referral,
      });

      const accessToken = await generateAccessToken(user._id);
      const refreshToken = await generateRefreshToken(user._id);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error("SignUpController Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = SignUpController;
