class ForgotPassword {
  constructor(forgotPasswordService) {
    this.forgotPasswordService = forgotPasswordService;

    // this bind the function to the class

    this.forgotPassword = this.forgotPassword.bind(this);
    this.verifyOtp = this.verifyOtp.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await this.forgotPasswordService.forgotPassword(email);
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await this.forgotPasswordService.verifyOtp(email, otp);
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;
      if (!newPassword || !email) {
        return res.status(400).json({ error: "Password is required" });
      }
      const result = await this.forgotPasswordService.resetPassword(
        email,
        newPassword
      );
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ForgotPassword;
