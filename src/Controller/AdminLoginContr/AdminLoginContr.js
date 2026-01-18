const bcrypt = require("bcryptjs");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../middlewares/JWT-Token");

class AdminLogin {
  constructor(LoginService) {
    this.LoginService = LoginService;
    this.login = this.login.bind(this);
  }

  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide userName and password" });
    }

    const user = await this.LoginService.login(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid userName or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid userName or password" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Sanitize user before returning
    const { password: _, refreshToken: __, ...safeUser } = user.toObject();

    return res.status(200).json({
      message: "Login successful",
      data: safeUser,
      accessToken,
    });
  }
}

module.exports = AdminLogin;
