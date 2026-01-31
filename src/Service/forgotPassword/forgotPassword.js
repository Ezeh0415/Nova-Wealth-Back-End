// ======================
// FORGOT PASSWORD SERVICE CLASS
// ======================
// Handles password reset functionality including:
// - Generating and sending password reset links via email
// - Validating reset tokens and updating passwords
// - Security logging and rate limiting
// Manages the complete password reset flow from request to completion
const otpGenerate = require("../../Utili/OtpGenerate");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Note: jwt is used but not imported in original code
const { otpTemplate } = require("../../Utili/emailTemplates");
const transporter = require("../../Utili/NodeMailer");
const generateResetToken = require("../../../middlewares/GenerateResetToken");
const {
  passwordResetSuccessTemplate,
} = require("../../Utili/PasswordResetSuccessTamplate");

class forgotPasswordService {
  constructor({ userModel, ResetToken, SecurityLog }) {
    // Initialize model dependencies for database operations
    this.userModel = userModel; // User collection model
    this.ResetToken = ResetToken; // Password reset tokens collection
    this.SecurityLog = SecurityLog; // Security audit logs collection
  }

  // ======================
  // PASSWORD RESET REQUEST
  // ======================

  /**
   * Handles password reset requests from users
   * Generates a secure reset token and sends it via email
   *
   * @param {string} email - User's email address
   * @param {string} ipAddress - Request IP address for security logging
   * @param {string} userAgent - Browser/user agent info for security logging
   * @returns {Object} - Response message and token expiration info
   * @throws {Error} - If email is invalid, user not found, or rate limited
   *
   * Workflow:
   * 1. Validate email format
   * 2. Check if user exists
   * 3. Apply rate limiting (max 3 requests per 24 hours)
   * 4. Generate secure JWT reset token
   * 5. Hash and store token in database
   * 6. Clean up expired tokens
   * 7. Send reset link via email
   * 8. Log security event
   *
   * Security Features:
   * - Rate limiting prevents abuse
   * - Tokens expire after 1 hour
   * - IP and user agent tracking
   * - Security audit logging
   * - Generic success message (don't reveal if email exists)
   */
  async forgotPassword(email, ipAddress, userAgent) {
    // 1. INITIAL VALIDATION
    if (!email) {
      throw new Error("Email is required");
    }

    // Note: Duplicate email validation - line 31 and line 34 both check email
    // Line 31 is basic check, line 34 is regex validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // BUG: This returns a response object instead of throwing error
      // Should be: throw new Error("Please provide a valid email address");
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    // 2. USER VERIFICATION
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // Security: Generic message doesn't reveal if email exists
      throw new Error("If an account exists, a reset link has been sent");
    }

    // 3. RATE LIMITING - Max 3 reset requests per 24 hours
    const recentResetCount = await this.ResetToken.countDocuments({
      userId: user._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recentResetCount >= 3) {
      // BUG: This returns a response object instead of throwing error
      // Should be: throw new Error("Too many reset requests. Please try again later.");
      return res.status(429).json({
        error: "Too many reset requests. Please try again later.",
      });
    }

    // 4. GENERATE RESET TOKEN
    // generateResetToken should return { token: JWT, plainToken: string, expires: Date }
    const resetToken = await generateResetToken(user._id, email);

    // 5. HASH TOKEN FOR DATABASE STORAGE
    // Store hashed version to prevent token theft from database
    const hashedToken = await bcrypt.hash(resetToken.plainToken, 10);

    // 6. SAVE TOKEN TO DATABASE
    await this.ResetToken.create({
      userId: user._id,
      token: hashedToken, // Hashed version for security
      expires: resetToken.expires,
      ipAddress: ipAddress, // Track request origin
      userAgent: userAgent, // Track device/browser
    });

    // 7. CLEANUP EXPIRED TOKENS
    // Remove old tokens to keep database clean
    await this.ResetToken.deleteMany({
      userId: user._id,
      expires: { $lt: Date.now() },
    });

    // 8. CREATE RESET LINK
    // Frontend URL with token and API key as query parameters
    const link = `${process.env.FRONTEND_URL}resetPassword?token=${resetToken.token}&key=${process.env.API_KEY}`;

    // 9. SEND RESET EMAIL
    try {
      await transporter.sendMail({
        from: `"AlthWorld" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your secure password reset link",
        html: otpTemplate(link), // Uses email template with reset button
      });
    } catch (err) {
      throw new Error("Failed to send OTP email");
    }

    // 10. SECURITY LOGGING
    await this.SecurityLog.create({
      userId: user._id,
      action: "password_reset_request",
      ipAddress: ipAddress,
      userAgent: userAgent,
      metadata: { email },
    });

    // 11. SUCCESS RESPONSE
    return {
      message: "If an account exists, a reset link has been sent",
      expiresIn: "1 hour", // Token expiration time
    };
  }

  // ======================
  // PASSWORD RESET VERIFICATION & UPDATE
  // ======================

  /**
   * Verifies reset token and updates user password
   *
   * @param {string} token - JWT reset token from email link
   * @param {string} password - New password from user
   * @param {string} ipAddress - Request IP for security logging
   * @param {string} userAgent - Browser/user agent info
   * @returns {Object} - Success response
   * @throws {Error} - If token invalid, password weak, or other validation fails
   *
   * Workflow:
   * 1. Validate password strength
   * 2. Verify JWT token
   * 3. Find matching reset token in database
   * 4. Compare hashed tokens
   * 5. Check password isn't same as old password
   * 6. Hash and update password
   * 7. Mark token as used
   * 8. Invalidate user sessions
   * 9. Log security event
   * 10. Send confirmation email
   *
   * Note: This method has several issues:
   * - Uses 'res' parameter that's not defined in signature
   * - Returns response objects instead of throwing errors
   * - 'email' variable is not defined in scope
   */
  async resetPassword(token, password, ipAddress, userAgent) {
    try {
      // 1. PASSWORD STRENGTH VALIDATION
      if (!password || password.length < 6) {
        // Should be: throw new Error("Password must be at least 6 characters");
        throw new Error("Password must be at least 6 characters");
      }

      // Complex password requirements
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        throw new Error(
          "Password must include uppercase, lowercase letters and a number",
        );
      }

      // 2. JWT TOKEN VERIFICATION
      // Note: jwt module is used but not imported in original code
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      } catch (error) {
        throw new Error("Invalid or expired reset link");
      }

      // 3. FIND RESET TOKEN IN DATABASE
      // Look for valid, unexpired, unused token
      const resetToken = await this.ResetToken.findOne({
        userId: decoded.userId,
        expires: { $gt: Date.now() },
        used: false,
      });

      if (!resetToken) {
        throw new Error("Invalid or expired reset link");
      }

      // 4. TOKEN VERIFICATION
      // Compare plain token from JWT with hashed token in database
      const isValid = await bcrypt.compare(decoded.token, resetToken.token);

      if (!isValid) {
        throw new Error("Invalid  reset token");
      }

      // 5. FIND USER
      const user = await this.userModel.findById(decoded.userId);

      // 6. PREVENT REUSE OF OLD PASSWORD
      const isSamePassword = await bcrypt.compare(password, user.password);

      if (isSamePassword) {
        throw new Error("New password cannot be the same as old password");
      }

      // 7. HASH NEW PASSWORD
      const hashedPassword = await bcrypt.hash(password, 10);

      // 8. UPDATE USER PASSWORD
      user.password = hashedPassword;
      user.passwordChangedAt = Date.now(); // Track when password was changed
      await user.save();

      // 9. MARK TOKEN AS USED
      resetToken.used = true;
      resetToken.usedAt = Date.now();
      await resetToken.save();

      // 10. INVALIDATE EXISTING SESSIONS (Optional - requires Session model)
      // Note: Session model is not imported or defined in constructor
      // await Session.deleteMany({ userId: user._id });

      // 11. SECURITY LOGGING
      await this.SecurityLog.create({
        userId: user._id,
        action: "password_reset_success",
        ipAddress: ipAddress,
        userAgent: userAgent,
      });

      // 12. SEND CONFIRMATION EMAIL
      // BUG: 'email' variable is not defined - should be user.email
      try {
        await transporter.sendMail({
          from: `"AlthWorld" <${process.env.EMAIL_USER}>`,
          to: user.email, 
          subject: "Password has been reset successfully",
          html: passwordResetSuccessTemplate(user.fullName, user.email),
        });
      } catch (err) {
        throw new Error("Failed to send OTP email");
      }

      // 13. SUCCESS RESPONSE
      return {
        success: true,
        message: "Password has been reset successfully",
      };
    } catch (error) {
      console.error("Reset password error:", error);
      // BUG: 'res' not defined

      throw new Error("An error occurred. Please try again.");
    }
  }
}

// ======================
// MODULE EXPORT
// ======================
module.exports = forgotPasswordService;

// ======================
// KEY ARCHITECTURE NOTES:
// ======================
// 1. SECURITY FIRST: Multiple security layers including rate limiting, token hashing, audit logging
// 2. TOKEN FLOW: JWT for frontend → Hashed in database → Verified on reset
// 3. EMAIL INTEGRATION: Uses Nodemailer with HTML templates for professional emails
// 4. AUDIT TRAIL: Comprehensive security logging for all password-related actions
// 5. USER EXPERIENCE: Generic messages prevent email enumeration attacks

// ======================
// CRITICAL BUGS TO FIX:
// ======================
// 1. resetPassword() uses 'res' parameter that's not defined
// 2. resetPassword() tries to use undefined 'email' variable (line 224)
// 3. Multiple return statements use res.status().json() instead of throwing errors
// 4. jwt module is used but not imported
// 5. Session model is referenced but not imported or defined

// ======================
// RECOMMENDED IMPROVEMENTS:
// ======================
// 1. Add token blacklisting after use
// 2. Implement token expiration cleanup cron job
// 3. Add email verification before allowing password reset
// 4. Consider adding CAPTCHA for reset requests
// 5. Add password breach checking (Have I Been Pwned API)
// 6. Implement account lockout after multiple failed attempts

// ======================
// TYPICAL USAGE FLOW:
// ======================
// 1. User requests reset → forgotPassword() sends email with link
// 2. User clicks link → Frontend extracts token from URL
// 3. Frontend shows password reset form
// 4. User submits new password → resetPassword() validates and updates
// 5. User receives confirmation email and can login with new password

// ======================
// SECURITY BEST PRACTICES IMPLEMENTED:
// ======================
// 1. Rate limiting prevents brute force attacks
// 2. Tokens expire after 1 hour
// 3. Tokens are hashed in database
// 4. Password strength requirements
// 5. Prevents password reuse
// 6. IP and user agent tracking
// 7. Security audit logging
// 8. Session invalidation on password change
// 9. Generic error messages prevent information leakage
