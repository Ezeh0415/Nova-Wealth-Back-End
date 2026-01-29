const otpGenerate = require("../../Utili/OtpGenerate");
const bcrypt = require("bcryptjs");
const { otpTemplate } = require("../../Utili/emailTemplates");
const transporter = require("../../Utili/NodeMailer");
const {
  generateResetToken,
} = require("../../../middlewares/GenerateResetToken");
const {
  passwordResetSuccessTemplate,
} = require("../../Utili/PasswordResetSuccessTamplate");

class forgotPasswordService {
  constructor({ userModel, ResetToken, SecurityLog }) {
    this.userModel = userModel;
    this.ResetToken = ResetToken;
    this.SecurityLog = SecurityLog;
  }

  async forgotPassword(email) {
    if (!email) {
      throw new Error("Email is required");
    }

    // 1. Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error("If an account exists, a reset link has been sent");
    }

    const recentResetCount = await ResetToken.countDocuments({
      userId: user._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recentResetCount >= 3) {
      return res.status(429).json({
        error: "Too many reset requests. Please try again later.",
      });
    }

    // 4. Generate reset token
    const resetToken = generateResetToken(user._id, email);

    // 5. Hash the plain token for database storage
    const hashedToken = await bcrypt.hash(resetToken.plainToken, 10);

    // 6. Save reset token to database
    await ResetToken.create({
      userId: user._id,
      token: hashedToken,
      expires: resetToken.expires,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // 7. Delete any expired tokens
    await ResetToken.deleteMany({
      userId: user._id,
      expires: { $lt: Date.now() },
    });

    const link = `${process.env.FRONTEND_URL}/resetPassword?token=${resetToken.token}&key=${process.env.API_KEY}`;

    try {
      await transporter.sendMail({
        from: `"Your App Name" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your secure password reset link",
        html: otpTemplate(link),
      });
    } catch (err) {
      throw new Error("Failed to send OTP email");
    }

    await SecurityLog.create({
      userId: user._id,
      action: "password_reset_request",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { email },
    });

    return {
      message: "If an account exists, a reset link has been sent",
      expiresIn: "1 hour",
    };
  }

  async resetPassword(token, password) {
    try {
      // 1. Validate password strength
      if (!password || password.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters",
        });
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return res.status(400).json({
          error:
            "Password must include uppercase, lowercase letters and a number",
        });
      }

      // 2. Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      } catch (error) {
        return res.status(400).json({
          error: "Invalid or expired reset link",
        });
      }

      // 3. Find the token in database
      const resetToken = await ResetToken.findOne({
        userId: decoded.userId,
        expires: { $gt: Date.now() },
        used: false,
      });

      if (!resetToken) {
        return res.status(400).json({
          error: "Invalid or expired reset link",
        });
      }

      // 4. Verify the plain token matches hashed token
      const isValid = await bcrypt.compare(decoded.token, resetToken.token);

      if (!isValid) {
        return res.status(400).json({
          error: "Invalid reset link",
        });
      }

      // 5. Check if new password is same as old password
      const user = await userModel.findById(decoded.userId);
      const isSamePassword = await bcrypt.compare(password, user.password);

      if (isSamePassword) {
        return res.status(400).json({
          error: "New password cannot be the same as old password",
        });
      }

      // 6. Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 7. Update user password
      user.password = hashedPassword;
      user.passwordChangedAt = Date.now();
      await user.save();

      // 8. Mark reset token as used
      resetToken.used = true;
      resetToken.usedAt = Date.now();
      await resetToken.save();

      // 9. Invalidate all existing sessions (optional)
      await Session.deleteMany({ userId: user._id });

      // 10. Log the password change
      await SecurityLog.create({
        userId: user._id,
        action: "password_reset_success",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // 11. Send confirmation email
      try {
        await transporter.sendMail({
          from: `"Your App Name" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Password has been reset successfully",
          html: passwordResetSuccessTemplate(user.fullName, user.email),
        });
      } catch (err) {
        throw new Error("Failed to send OTP email");
      }
      res.json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        error: "An error occurred. Please try again.",
      });
    }
  }
}

module.exports = forgotPasswordService;
