const otpGenerate = require("../../Utili/OtpGenerate");
const bcrypt = require("bcryptjs");
const { otpTemplate } = require("../../Utili/emailTemplates");
const transporter = require("../../Utili/NodeMailer");

class forgotPasswordService {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async forgotPassword(email) {
    if (!email) {
      throw new Error("Email is required");
    }
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.otpExpires && user.otpExpires > Date.now()) {
      throw new Error("OTP already sent. Please wait before requesting again.");
    }

    const otp = await otpGenerate();

    const otpHash = await bcrypt.hash(otp, 10);
    user.otp = otpHash;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    try {
      await transporter.sendMail({
        from: `"Your App Name" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Code",
        html: otpTemplate(otp),
      });
    } catch (err) {
      throw new Error("Failed to send OTP email");
    }
    return { message: "OTP sent to email" };
  }

  async verifyOtp(email, otp) {
    const user = await this.userModel.findOne({ email: email });
    if (!user) {
      throw new Error("User not found");
    }

    const isvalid = await bcrypt.compare(otp, user.otp);

    if (!isvalid) {
      throw new Error("Invalid OTP");
    }

    
    if (Date.now() > user.otpExpires) {
      throw new Error("OTP has expired");
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return { message: "OTP verified" };
  }

  async resetPassword(email, newPassword) {
    const user = await this.userModel.findOne({ email: email });
    if (!user) {
      throw new Error("User not found");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    return { message: "Password reset successful" };
  }
}

module.exports = forgotPasswordService;
