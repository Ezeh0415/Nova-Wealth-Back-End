class ForgotPassword {
  constructor(forgotPasswordService) {
    this.forgotPasswordService = forgotPasswordService;

    // this bind the function to the class

    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  async forgotPassword(req, res) {
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    try {
      const { email } = req.body;
      const result = await this.forgotPasswordService.forgotPassword(
        email,
        ipAddress,
        userAgent,
      );
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req, res) {
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: "Password is required" });
      }

      const result = await this.forgotPasswordService.resetPassword(
        token,
        password,
        ipAddress,
        userAgent,
      );
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ForgotPassword;
