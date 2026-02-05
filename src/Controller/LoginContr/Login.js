const bcrypt = require("bcryptjs");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../middlewares/JWT-Token");

class Login {
  constructor(LoginService) {
    this.LoginService = LoginService;
    this.login = this.login.bind(this);
  }

  async login(req, res) {
    try {
      const { userName, password } = req.body;

      if (!userName || !password) {
        return res
          .status(400)
          .json({ message: "Please provide userName and password" });
      }

      const user = await this.LoginService.login(userName);
      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid userName or password" });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res
          .status(400)
          .json({ message: "Invalid userName or password" });
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
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = Login;
