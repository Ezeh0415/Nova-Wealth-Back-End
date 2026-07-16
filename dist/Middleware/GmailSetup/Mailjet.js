"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailSender = exports.MailSender = void 0;
const node_mailjet_1 = __importDefault(require("node-mailjet"));
const Config_1 = require("../../config/Config");
class MailSender {
    constructor() {
        this.config = Config_1.AppConfig.getInstance();
        this.mailjetClient = node_mailjet_1.default.apiConnect(this.config.MJ_APIKEY_PUBLIC, this.config.MJ_APIKEY_PRIVATE);
        this.checkConnection(); // Optional: check connection on init
    }
    static getInstance() {
        if (!MailSender.instance) {
            MailSender.instance = new MailSender();
        }
        return MailSender.instance;
    }
    // Get the mailjet client instance
    getClient() {
        return this.mailjetClient;
    }
    // Optional: Check connection
    async checkConnection() {
        try {
            await this.mailjetClient
                .get("user")
                .request();
            console.log(" Mail server is ready - Connected successfully");
        }
        catch (error) {
            console.error(" Mail server error:", error.statusCode, error.message);
        }
    }
    // Send email
    async sendEmail(to, subject, html) {
        try {
            const result = await this.mailjetClient
                .post("send", { version: "v3.1" })
                .request({
                Messages: [
                    {
                        From: {
                            Email: this.config.EMAIL_USER || "noreply@althworld.com",
                            Name: "ALTHWORLD-GLOBAL",
                        },
                        To: [
                            {
                                Email: to,
                            },
                        ],
                        Subject: subject,
                        HTMLPart: html,
                    },
                ],
            });
            console.log(` Email sent to ${to}`);
            return result;
        }
        catch (error) {
            console.error(" Failed to send email:", error.message);
            throw error;
        }
    }
    async dobuleSendEmail(to, subject, html) {
        try {
            const result = await this.mailjetClient
                .post("send", { version: "v3.1" })
                .request({
                Messages: [
                    {
                        From: {
                            Email: this.config.EMAIL_USER || "noreply@althworld.com",
                            Name: "ALTHWORLD-GLOBAL",
                        },
                        To: [
                            {
                                Email: to,
                            },
                            {
                                Email: this.config.ADMIN_EMAIL_USER
                            },
                        ],
                        Subject: subject,
                        HTMLPart: html,
                    },
                ],
            });
            console.log(` Email sent to ${to}`);
            return result;
        }
        catch (error) {
            console.error(" Failed to send email:", error.message);
            throw error;
        }
    }
    // Send welcome email
    async sendWelcomeEmail(to, fullName, link) {
        const html = this.welcomeTemplate(fullName, link);
        return this.sendEmail(to, "WELCOME TO ALTHWORLD-GLOBAL!", html);
    }
    // admin welcome email
    async sendAdminWelcomEmail(to, fullName, userName, email, ipAddress, userAgent) {
        const html = this.adminWelcomeTemplate(fullName, userName, email, ipAddress, userAgent);
        return this.sendEmail(to, `New User Registration: ${userName}`, html);
    }
    // send forggoten password email 
    async sendOtpEmail(to, link) {
        const html = this.resertPasswordEmail(link);
        return this.sendEmail(to, "Your secure password reset link", html);
    }
    async sendPasswordChangeEmail(to, userName, userEmail) {
        const html = this.passwordResetSuccess(userName, userEmail);
        return this.sendEmail(to, "password changed successfully", html);
    }
    async sendUserDeposit(to, userId, type, currency, requestedAmount, status, createdAt, userEmail, userFullName) {
        const html = this.userDeposit(userId, type, currency, requestedAmount, status, createdAt, userEmail, userFullName);
        return this.dobuleSendEmail(to, `deposit of ${requestedAmount} ${currency.toUpperCase()} is pending confirmation`, html);
    }
    async sendUserWithdrawal(to, userId, type, currency, requestedAmount, status, createdAt, userEmail, userFullName) {
        const html = this.userDeposit(userId, type, currency, requestedAmount, status, createdAt, userEmail, userFullName);
        return this.dobuleSendEmail(to, `Withdrawal of ${requestedAmount} ${currency.toUpperCase()} is pending confirmation`, html);
    }
    async confirmDeposit(to, userId, type, currency, creditedAmount, status, creditedAt, userEmail, userFullName, transactionId, isFirstDeposit) {
        const html = this.AdminDepositConfirm(userId, type, currency, creditedAmount, status, creditedAt, userEmail, userFullName, transactionId, isFirstDeposit);
        return this.dobuleSendEmail(to, `deposit of ${creditedAmount} ${currency.toUpperCase()} has been confirmed!`, html);
    }
    async confirmWithdrawal(to, userId, type, currency, creditedAmount, status, creditedAt, userEmail, userFullName, transactionId) {
        const html = this.AdminWithdrawalConfirm(userId, type, currency, creditedAmount, status, creditedAt, userEmail, userFullName, transactionId);
        return this.dobuleSendEmail(to, `deposit of ${creditedAmount} ${currency.toUpperCase()} has been confirmed!`, html);
    }
    async Investment(to, subject, userData) {
        const html = this.investmentConfirmationTemplate(userData);
        return this.dobuleSendEmail(to, subject, html);
    }
    // registration  Email templates
    welcomeTemplate(fullName, link) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #10b981; color: white; padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0;">Welcome to AlthWorld!</h1>
                    <p style="opacity: 0.9; margin-top: 10px;">Your Wellness Journey Begins Here</p>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #065f46;">Hello ${fullName},</h2>
                    <p>We're excited to have you join the AlthWorld community!</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${link}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Start Your Journey
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    adminWelcomeTemplate(fullName, userName, email, ipAddress, userAgent) {
        const signupTime = new Date().toLocaleString();
        const appName = "Althworld Global";
        return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New User Registration - ${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0fdf4;">
      
      <!-- Main Container -->
      <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -12px rgba(16, 185, 129, 0.3); border: 1px solid #d1fae5;">
        
        <!-- Header with Wave Effect -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 40px 30px; text-align: center; position: relative;">
          <!-- Decorative Circles -->
          <div style="position: absolute; top: -20px; right: -20px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.05); border-radius: 50%;"></div>
          
          <!-- Icon -->
          <div style="width: 70px; height: 70px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255, 255, 255, 0.5);">
            <span style="font-size: 35px;">👤</span>
          </div>
          
          <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">New User Alert! 🎉</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin-top: 10px; font-size: 16px;">${appName} just got a new member</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background: white;">
          
          <!-- Welcome Message -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #f0fdf4; padding: 8px 20px; border-radius: 50px; color: #065f46; font-weight: 600; font-size: 14px;">
              ⚡ User Joined • ${signupTime}
            </div>
          </div>
          
          <!-- User Details Card -->
          <div style="background: #f0fdf4; border-radius: 20px; padding: 25px; border: 1px solid #d1fae5; margin-bottom: 30px;">
            <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">📋</span> User Information
            </h3>
            
            <!-- Grid Layout -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              
              <!-- Full Name -->
              <div style="background: white; border-radius: 12px; padding: 15px; border: 1px solid #d1fae5;">
                <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Full Name</div>
                <div style="color: #065f46; font-weight: 700; font-size: 16px;">${fullName}</div>
              </div>
              
              <!-- Username -->
              <div style="background: white; border-radius: 12px; padding: 15px; border: 1px solid #d1fae5;">
                <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Username</div>
                <div style="color: #065f46; font-weight: 700; font-size: 16px;">@${userName}</div>
              </div>
              
              <!-- Email (spans full width) -->
              <div style="grid-column: span 2; background: white; border-radius: 12px; padding: 15px; border: 1px solid #d1fae5;">
                <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Email Address</div>
                <div style="color: #065f46; font-weight: 700; font-size: 16px;">
                  <a href="mailto:${email}" style="color: #10b981; text-decoration: none;">${email}</a>
                </div>
              </div>
              
              <!-- IP Address -->
              <div style="background: white; border-radius: 12px; padding: 15px; border: 1px solid #d1fae5;">
                <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">IP Address</div>
                <div style="color: #065f46; font-weight: 600; font-size: 14px; font-family: monospace;">${ipAddress || 'N/A'}</div>
              </div>
              
              <!-- Time -->
              <div style="background: white; border-radius: 12px; padding: 15px; border: 1px solid #d1fae5;">
                <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Signup Time</div>
                <div style="color: #065f46; font-weight: 600; font-size: 14px;">${signupTime}</div>
              </div>
              
              <!-- User Agent (spans full width) -->
              <div style="grid-column: span 2; background: white; border-radius: 12px; padding: 15px; border: 1px solid #d1fae5;">
                <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Device & Browser</div>
                <div style="color: #065f46; font-weight: 500; font-size: 13px; line-height: 1.5; word-break: break-word; font-family: monospace;">
                  ${userAgent || 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quick Stats -->
          <div style="display: flex; gap: 15px; margin-bottom: 30px;">
            <div style="flex: 1; background: #ecfdf5; border-radius: 12px; padding: 15px; text-align: center;">
              <div style="color: #10b981; font-size: 24px; font-weight: 700;">${new Date().getHours()}</div>
              <div style="color: #6b7280; font-size: 12px;">Hour of signup</div>
            </div>
            <div style="flex: 1; background: #ecfdf5; border-radius: 12px; padding: 15px; text-align: center;">
              <div style="color: #10b981; font-size: 24px; font-weight: 700;">📱</div>
              <div style="color: #6b7280; font-size: 12px;">${userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="text-align: center;">
            <a href="https://${appName.toLowerCase()}.com/admin/users/${userName}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; margin-right: 10px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
              👤 View User Profile
            </a>
            <a href="https://${appName.toLowerCase()}.com/admin/users" 
               style="display: inline-block; background: white; color: #10b981; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; border: 2px solid #10b981;">
              📋 Manage Users
            </a>
          </div>
          
          <!-- Footer Note -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px dashed #d1fae5; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              ⚡ This is an automated notification from ${appName}. 
              No action is required unless you suspect suspicious activity.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f0fdf4; padding: 20px; text-align: center; border-top: 1px solid #d1fae5;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0;">
            ${appName} • Building the future of wealth
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
    }
    resertPasswordEmail(link, appName = "ALTHWORLD-GLOBAL") {
        return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - Password Reset</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        background-color: #f8fafc; 
        color: #334155; 
        line-height: 1.6;
      }
      
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff; 
        border-radius: 12px; 
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
      }
      
      .header { 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white; 
        text-align: center; 
        padding: 30px 20px;
      }
      
      .logo-text {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.5px;
        margin-bottom: 8px;
      }
      
      .tagline {
        font-size: 14px;
        opacity: 0.9;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      
      .content {
        padding: 40px 30px;
        text-align: center;
      }
      
      .title {
        font-size: 24px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 16px;
      }
      
      .message {
        font-size: 16px;
        color: #475569;
        margin-bottom: 30px;
        line-height: 1.7;
      }
      
      .reset-button {
        display: inline-block;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        text-decoration: none;
        padding: 16px 40px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(16, 185, 129, 0.2);
        margin: 20px 0;
      }
      
      .reset-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      }
      
      .security-note {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin: 25px 0;
        text-align: left;
      }
      
      .security-title {
        font-size: 14px;
        font-weight: 600;
        color: #10b981;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .security-title:before {
        content: "🔒";
        font-size: 16px;
      }
      
      .security-text {
        font-size: 13px;
        color: #64748b;
        line-height: 1.5;
      }
      
      .instructions {
        text-align: left;
        background-color: #f1f5f9;
        border-radius: 8px;
        padding: 20px;
        margin: 25px 0;
      }
      
      .instructions-title {
        font-size: 16px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 12px;
      }
      
      .instructions-list {
        list-style: none;
        padding: 0;
      }
      
      .instructions-list li {
        font-size: 14px;
        color: #475569;
        margin-bottom: 10px;
        padding-left: 24px;
        position: relative;
      }
      
      .instructions-list li:before {
        content: "✓";
        color: #10b981;
        font-weight: bold;
        position: absolute;
        left: 0;
      }
      
      .expiry-note {
        font-size: 14px;
        color: #ef4444;
        font-weight: 500;
        margin: 20px 0;
        padding: 12px;
        background-color: #fef2f2;
        border-radius: 8px;
        border-left: 4px solid #ef4444;
      }
      
      .link-alt {
        font-size: 13px;
        color: #64748b;
        margin-top: 20px;
        word-break: break-all;
        padding: 12px;
        background-color: #f8fafc;
        border-radius: 6px;
        border: 1px dashed #cbd5e1;
      }
      
      .link-alt a {
        color: #3b82f6;
        text-decoration: none;
      }
      
      .footer { 
        text-align: center; 
        font-size: 12px; 
        color: #94a3b8; 
        padding: 25px 30px;
        background-color: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      
      .footer-links {
        margin-top: 15px;
      }
      
      .footer-links a {
        color: #64748b;
        text-decoration: none;
        margin: 0 10px;
        font-size: 11px;
      }
      
      .footer-links a:hover {
        color: #10b981;
      }
      
      @media (max-width: 640px) {
        .container {
          border-radius: 0;
          margin: 0;
        }
        
        .content {
          padding: 30px 20px;
        }
        
        .reset-button {
          padding: 14px 30px;
          font-size: 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo-text">${appName}</div>
        <div class="tagline">SECURE PASSWORD RESET</div>
      </div>
      
      <div class="content">
        <h2 class="title">Reset Your Password</h2>
        
        <p class="message">
          You requested to reset your password for your ${appName} account. 
          Click the button below to securely reset your password.
        </p>
        
        <a href="${link}" class="reset-button" target="_blank">
          Reset Password
        </a>
        
        <div class="security-note">
          <div class="security-title">Security Notice</div>
          <p class="security-text">
            This link is encrypted with 256-bit SSL encryption and will expire in 1 hour. 
            If you didn't request this password reset, please ignore this email or contact support.
          </p>
        </div>
        
        <div class="instructions">
          <h3 class="instructions-title">Instructions:</h3>
          <ul class="instructions-list">
            <li>Click the "Reset Password" button above</li>
            <li>Create a new secure password</li>
            <li>Sign in with your new credentials</li>
            <li>If the button doesn't work, copy and paste the link below</li>
          </ul>
        </div>
        
        <div class="expiry-note">
          ⚠️ This password reset link expires in 1 hour for security reasons.
        </div>
        
        <div class="link-alt">
          If the button doesn't work, copy and paste this link into your browser:<br><br>
          <a href="${link}">${link}</a>
        </div>
        
        <p style="margin-top: 25px; font-size: 14px; color: #64748b;">
          Need help? <a href="mailto:support@althworld.com" style="color: #10b981; text-decoration: none;">Contact our support team</a>
        </p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        <p>This email was sent to you as part of your account security.</p>
        
        <div class="footer-links">
          <a href="https://althworldf.onrender.com/privacy">Privacy Policy</a>
          <a href="https://althworldf.onrender.com/terms">Terms of Service</a>
          <a href="https://althworldf.onrender.com/security">Security</a>
          <a href="https://althworldf.onrender.com/help">Help Center</a>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
    }
    passwordResetSuccess(userName, userEmail, appName = "ALTHWORLD-GLOBAL") {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful - ${appName}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f5f7fa;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #4a90e2, #357abd);
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background-color: #4CAF50;
            border-radius: 50%;
            margin: 0 auto 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 40px;
            font-weight: bold;
        }
        .title {
            color: #2c3e50;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .user-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
            border: 1px solid #eaeaea;
        }
        .user-info h3 {
            color: #2c3e50;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .user-info h3::before {
            content: "👤";
            font-size: 20px;
        }
        .info-row {
            display: flex;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #eaeaea;
        }
        .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #5a6c7d;
            min-width: 80px;
            font-size: 14px;
        }
        .info-value {
            color: #2c3e50;
            font-weight: 500;
            flex: 1;
            font-size: 14px;
        }
        .message {
            color: #5a6c7d;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .security-tips {
            background-color: #f8f9fa;
            border-left: 4px solid #4a90e2;
            padding: 20px;
            text-align: left;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .security-tips h3 {
            color: #2c3e50;
            margin-top: 0;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .security-tips h3::before {
            content: "🔒";
        }
        .security-tips ul {
            padding-left: 20px;
            margin: 10px 0;
        }
        .security-tips li {
            margin-bottom: 8px;
            color: #5a6c7d;
        }
        .cta-button {
            display: inline-block;
            background-color: #4a90e2;
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: background-color 0.3s ease;
        }
        .cta-button:hover {
            background-color: #357abd;
        }
        .footer {
            background-color: #f5f7fa;
            padding: 25px;
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
            border-top: 1px solid #eaeaea;
        }
        .footer p {
            margin: 5px 0;
        }
        .support {
            margin-top: 20px;
            font-size: 14px;
        }
        .support a {
            color: #4a90e2;
            text-decoration: none;
        }
        .timestamp {
            color: #95a5a6;
            font-size: 13px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
        }
        @media only screen and (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 25px 15px;
            }
            .header h1 {
                font-size: 24px;
            }
            .info-row {
                flex-direction: column;
                gap: 4px;
            }
            .info-label {
                min-width: auto;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${appName}</h1>
            <p>Security Notification</p>
        </div>
        
        <div class="content">
            <div class="success-icon">✓</div>
            
            <h2 class="title">Password Reset Successful</h2>
            
            <p class="message">
                Your password has been successfully reset. You can now log in to your ${appName} account using your new password.
            </p>
            
            ${userName || userEmail
            ? `
            <div class="user-info">
                <h3>Account Information</h3>
                ${userName
                ? `
                <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value">${userName}</div>
                </div>
                `
                : ""}
                ${userEmail
                ? `
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${userEmail}</div>
                </div>
                `
                : ""}
            </div>
            `
            : ""}
            
            <a href="${this.config.FRONTEND_URL}login?key=${this.config.API_KEY}" class="cta-button">
                Log In to Your Account
            </a>
            
            <div class="security-tips">
                <h3>Security Tips:</h3>
                <ul>
                    <li>Use a strong, unique password for your account</li>
                    <li>Never share your password with anyone</li>
                    <li>Enable two-factor authentication for added security</li>
                    <li>Always log out from shared devices</li>
                    <li>Regularly update your password</li>
                </ul>
            </div>
            
            <p class="message">
                If you did not initiate this password reset, please contact our support team immediately.
            </p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from ${appName}. Please do not reply to this email.</p>
            
            <div class="support">
                // <p>Need help? <a href="${this.config.FRONTEND_URL}support?key=${this.config.API_KEY}">Contact Support</a></p>
            </div>
            
            <div class="timestamp">
                <p>Password reset completed on: ${new Date().toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
        })}</p>
            </div>
            
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
    }
    // Transaction Email Templates
    userDeposit(userId, type, currency, requestedAmount, status, createdAt, userEmail, userFullName, appName = "ALTHWORLD-GLOBAL") {
        const depositTime = new Date(createdAt).toLocaleString();
        const amountInDollars = (requestedAmount / 100).toFixed(2);
        const transactionId = userId.toString().slice(-8) + Date.now().toString().slice(-6);
        return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Deposit Confirmation - ${appName}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f0fdf4;">
          
          <!-- Main Container -->
          <div style="max-width: 500px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 100, 0, 0.1);">
            
            <!-- Green Header -->
            <div style="background: #10b981; padding: 30px 20px; text-align: center;">
              <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">💰</span>
              </div>
              <h1 style="margin: 0; color: white; font-size: 24px;">Deposit Received!</h1>
              <p style="color: #e6f7e6; margin: 5px 0 0; font-size: 16px;">Hello, ${userFullName || 'Valued Customer'}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 25px;">
              
              <!-- Amount Box -->
              <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px; border: 1px solid #10b981;">
                <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Amount</div>
                <div style="color: #10b981; font-size: 36px; font-weight: 700;">$${amountInDollars}</div>
                <div style="color: #6b7280; font-size: 14px;">${currency}</div>
              </div>
              
              <!-- Status -->
              <div style="background: #fef3c7; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 25px;">
                <span style="color: #92400e; font-weight: 600;">⏳ Status: ${status.toUpperCase()}</span>
              </div>
              
              <!-- Transaction Details -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #374151; font-size: 16px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Transaction Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Transaction ID</td>
                    <td style="padding: 8px 0; color: #374151; font-weight: 500; text-align: right;">#${transactionId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Date & Time</td>
                    <td style="padding: 8px 0; color: #374151; text-align: right;">${depositTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Type</td>
                    <td style="padding: 8px 0; color: #374151; text-align: right; text-transform: capitalize;">${type}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Email</td>
                    <td style="padding: 8px 0; color: #374151; text-align: right;">${userEmail}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Note -->
              <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  <span style="color: #10b981;">⏱️</span> Your deposit is being processed. You'll receive another email once confirmed.
                </p>
              </div>
              
              <!-- Button -->
              <div style="text-align: center;">
                <a href="https://althworldglobal.com/dashboard" 
                   style="display: inline-block; background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                  Go to Dashboard
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0;">
                Need help? Contact support@${appName.toLowerCase()}.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    AdminDepositConfirm(userId, type, currency, creditedAmount, status, creditedAt, userEmail, userFullName, transactionId, isFirstDeposit, appName = "ALTHWORLD-GLOBAL") {
        const depositTime = new Date(creditedAt).toLocaleString();
        const amountInDollars = (creditedAmount / 100).toFixed(2);
        const displayTransactionId = transactionId ||
            userId.toString().slice(-8) + Date.now().toString().slice(-6);
        return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${type} Confirmed - ${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #e6f7f0;">
      
      <!-- Main Container -->
      <div style="max-width: 520px; margin: 20px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0, 150, 100, 0.3);">
        
        <!-- Teal Gradient Header - Different from withdrawal's green -->
        <div style="background: linear-gradient(135deg, #0f766e, #14b8a6); padding: 35px 25px; text-align: center; position: relative;">
          <!-- Decorative circles -->
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
          
          <!-- Icon -->
          <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); border: 2px solid rgba(255,255,255,0.3);">
            <span style="font-size: 32px; color: white;">✅</span>
          </div>
          
          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">${type} Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Hello, ${userFullName || "Valued Customer"}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 35px 30px;">
          
          <!-- Success Message Banner (matches your message format) -->
          <div style="background: #d1fae5; border-radius: 50px; padding: 12px 20px; margin-bottom: 30px; text-align: center; border-left: 4px solid #0f766e;">
            <p style="margin: 0; color: #0f766e; font-size: 16px; font-weight: 500;">
              ✅ Your ${type} of <strong>$${amountInDollars}</strong> has been confirmed.${isFirstDeposit ? " 🎉 This was your first deposit!" : ""}
            </p>
          </div>
          
          <!-- Amount Card - Different style -->
          <div style="background: linear-gradient(145deg, #f0fdf9, #ffffff); border-radius: 20px; padding: 25px; margin-bottom: 30px; border: 1px dashed #14b8a6; text-align: center;">
            <div style="color: #047857; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Amount Credited</div>
            <div style="color: #0f766e; font-size: 48px; font-weight: 800; line-height: 1.2;">$${amountInDollars}</div>
            <div style="color: #6b7280; font-size: 14px; margin-top: 8px;">${currency}</div>
            <div style="margin-top: 15px;">
              <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 30px; font-size: 12px; font-weight: 600;">${status || "COMPLETED"}</span>
            </div>
          </div>
          
          <!-- Transaction Details - Matches withdrawal template structure -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; gap: 8px;">
              <span style="background: #0f766e; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
              Transaction Details
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px;">Transaction ID</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; text-align: right; font-family: monospace;">${displayTransactionId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Date & Time</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6;">${depositTime}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Type</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; text-transform: capitalize; border-top: 1px solid #f3f4f6;">${type}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Email</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Category</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6; text-transform: capitalize;">Transaction</td>
              </tr>
            </table>
          </div>
          
          <!-- First Deposit Special Message (Conditional) -->
          ${isFirstDeposit
            ? `
          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 12px; padding: 15px; margin-bottom: 25px; text-align: center;">
            <span style="font-size: 24px; display: block; margin-bottom: 5px;">🎉 ⭐ 🎉</span>
            <p style="margin: 0; color: white; font-weight: 600; font-size: 16px;">Congratulations on your first deposit!</p>
          </div>
          `
            : ""}
          ${type === "Withdrawal"
            ? `
          <!-- Note - Similar structure to withdrawal template -->
          <div style="background: #ecfdf5; border-radius: 12px; padding: 15px; margin-bottom: 30px; border: 1px solid #a7f3d0;">
            <p style="margin: 0; color: #065f46; font-size: 14px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">💰</span> 
              Your funds are now available in your wallet. You can withdraw or invest them immediately.
            </p>
          </div>
          
          <!-- Button -->
          <div style="text-align: center;">
            <a href="https://althworldglobal.com/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #0f766e, #14b8a6); color: white; padding: 14px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 20px -5px rgba(20, 184, 166, 0.3);">
              View My Wallet →
            </a>
          </div>
          `
            : ""}
          
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">
            Need help? <a href="mailto:support@${appName.toLowerCase()}.com" style="color: #0f766e; text-decoration: none; font-weight: 500;">support@${appName.toLowerCase()}.com</a>
          </p>
          <p style="color: #9ca3af; font-size: 10px; margin: 10px 0 0;">
            <a href="#" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
    }
    AdminWithdrawalConfirm(userId, type, currency, creditedAmount, status, creditedAt, userEmail, userFullName, transactionId, appName = "ALTHWORLD-GLOBAL") {
        const depositTime = new Date(creditedAt).toLocaleString();
        const amountInDollars = (creditedAmount / 100).toFixed(2);
        const displayTransactionId = transactionId ||
            userId.toString().slice(-8) + Date.now().toString().slice(-6);
        return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${type} Confirmed - ${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #e6f7f0;">
      
      <!-- Main Container -->
      <div style="max-width: 520px; margin: 20px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0, 150, 100, 0.3);">
        
        <!-- Teal Gradient Header - Different from withdrawal's green -->
        <div style="background: linear-gradient(135deg, #0f766e, #14b8a6); padding: 35px 25px; text-align: center; position: relative;">
          <!-- Decorative circles -->
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
          
          <!-- Icon -->
          <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); border: 2px solid rgba(255,255,255,0.3);">
            <span style="font-size: 32px; color: white;">✅</span>
          </div>
          
          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">${type} Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Hello, ${userFullName || "Valued Customer"}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 35px 30px;">
          
          <!-- Success Message Banner (matches your message format) -->
          <div style="background: #d1fae5; border-radius: 50px; padding: 12px 20px; margin-bottom: 30px; text-align: center; border-left: 4px solid #0f766e;">
            <p style="margin: 0; color: #0f766e; font-size: 16px; font-weight: 500;">
              ✅ Your ${type} of <strong>$${amountInDollars}</strong> has been confirmed.
            </p>
          </div>
          
          <!-- Amount Card - Different style -->
          <div style="background: linear-gradient(145deg, #f0fdf9, #ffffff); border-radius: 20px; padding: 25px; margin-bottom: 30px; border: 1px dashed #14b8a6; text-align: center;">
            <div style="color: #047857; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Amount Credited</div>
            <div style="color: #0f766e; font-size: 48px; font-weight: 800; line-height: 1.2;">$${amountInDollars}</div>
            <div style="color: #6b7280; font-size: 14px; margin-top: 8px;">${currency}</div>
            <div style="margin-top: 15px;">
              <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 30px; font-size: 12px; font-weight: 600;">${status || "COMPLETED"}</span>
            </div>
          </div>
          
          <!-- Transaction Details - Matches withdrawal template structure -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; gap: 8px;">
              <span style="background: #0f766e; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
              Transaction Details
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px;">Transaction ID</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; text-align: right; font-family: monospace;">${displayTransactionId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Date & Time</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6;">${depositTime}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Type</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; text-transform: capitalize; border-top: 1px solid #f3f4f6;">${type}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Email</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Category</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6; text-transform: capitalize;">Transaction</td>
              </tr>
            </table>
          </div>
          
          ${type === "Withdrawal"
            ? `
          <!-- Note - Similar structure to withdrawal template -->
          <div style="background: #ecfdf5; border-radius: 12px; padding: 15px; margin-bottom: 30px; border: 1px solid #a7f3d0;">
            <p style="margin: 0; color: #065f46; font-size: 14px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">💰</span> 
              Your funds are now available in your wallet. You can withdraw or invest them immediately.
            </p>
          </div>
          
          <!-- Button -->
          <div style="text-align: center;">
            <a href="https://althworldglobal.com/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #0f766e, #14b8a6); color: white; padding: 14px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 20px -5px rgba(20, 184, 166, 0.3);">
              View My Wallet →
            </a>
          </div>
          `
            : ""}
          
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">
            Need help? <a href="mailto:support@${appName.toLowerCase()}.com" style="color: #0f766e; text-decoration: none; font-weight: 500;">support@${appName.toLowerCase()}.com</a>
          </p>
          <p style="color: #9ca3af; font-size: 10px; margin: 10px 0 0;">
            <a href="#" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
    }
    investmentConfirmationTemplate(userData) {
        const { _id, userId, amount, roi, TotalReturns = 0, lastRoiAt, investmentType, investmentStatus, investmentStartDate, createdAt, formatType, appName = "ALTHWORLD-GLOBAL" } = userData;
        // Format dates
        const startDate = new Date(investmentStartDate);
        const createdDate = new Date(createdAt);
        const formatDate = (date) => date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const formatDateTime = (date) => date.toLocaleString();
        // Calculate investment metrics
        const totalReturnsAmount = Number(TotalReturns) || 0;
        const amountInDollars = (amount / 100).toFixed(2);
        const returnsInDollars = (totalReturnsAmount / 100).toFixed(2);
        const totalValueInDollars = ((amount + totalReturnsAmount) / 100).toFixed(2);
        // Generate investment ID
        const investmentId = _id?.toString().slice(-8) ||
            userId.toString().slice(-8) + Date.now().toString().slice(-6);
        // Format investment type
        const formattedType = investmentType.charAt(0).toUpperCase() + investmentType.slice(1);
        // Helper function for table rows
        const createTableRow = (label, value, valueStyles = "") => `
    <tr>
      <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">${label}</td>
      <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6; ${valueStyles}">${value}</td>
    </tr>
  `;
        // Generate table rows
        const detailsRows = [
            createTableRow("Plan Type", formattedType, "font-weight: 600; text-transform: capitalize;"),
            createTableRow("Start Date", formatDate(startDate)),
            createTableRow("Total Value", `$${totalValueInDollars}`, "color: #667eea; font-weight: 700;"),
            createTableRow("Last ROI Update", lastRoiAt ? formatDateTime(new Date(lastRoiAt)) : "Not yet calculated")
        ].join("");
        return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Investment ${formatType || formattedType} - ${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #667eea20, #764ba220);">
      
      <!-- Main Container -->
      <div style="max-width: 550px; margin: 30px auto; background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(102, 126, 234, 0.4); border: 1px solid rgba(102, 126, 234, 0.1);">
        
        <!-- Purple Gradient Header -->
        <div style="background: linear-gradient(145deg, #667eea, #764ba2); padding: 40px 30px; text-align: center; position: relative;">
          <div style="position: absolute; top: -40px; right: -40px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -40px; left: -40px; width: 180px; height: 180px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
          
          <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); border: 3px solid rgba(255,255,255,0.3);">
            <span style="font-size: 38px;">📈</span>
          </div>
          
          <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Investment Activated!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 18px;">Your ${formattedType} Plan</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 35px 30px;">
          
          <!-- Investment Summary Card -->
          <div style="background: linear-gradient(145deg, #f5f0ff, #ffffff); border-radius: 24px; padding: 25px; margin-bottom: 30px; border: 1px solid #e0d7ff; box-shadow: 0 10px 25px -8px rgba(102, 126, 234, 0.15);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <span style="background: #667eea; color: white; padding: 5px 15px; border-radius: 30px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${investmentStatus}</span>
              <span style="color: #6b7280; font-size: 13px;">ID: ${investmentId}</span>
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Investment Amount</div>
              <div style="color: #667eea; font-size: 48px; font-weight: 800; line-height: 1.2;">$${amountInDollars}</div>
              <div style="color: #9ca3af; font-size: 14px; margin-top: 5px;">USD</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
              <div style="background: #f9f7ff; border-radius: 16px; padding: 15px; text-align: center;">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 5px;">ROI Rate</div>
                <div style="color: #667eea; font-size: 24px; font-weight: 700;">${roi}%</div>
                <div style="color: #9ca3af; font-size: 11px;">Daily</div>
              </div>
              <div style="background: #f9f7ff; border-radius: 16px; padding: 15px; text-align: center;">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 5px;">Total Returns</div>
                <div style="color: #10b981; font-size: 24px; font-weight: 700;">+$${returnsInDollars}</div>
                <div style="color: #9ca3af; font-size: 11px;">Earned so far</div>
              </div>
            </div>
          </div>
          
          <!-- Investment Details -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #f3f4f6; display: flex; align-items: center; gap: 8px;">
              <span style="background: #667eea; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
              Investment Details
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${detailsRows}
            </table>
          </div>
          
          <!-- Daily Returns Info -->
          <div style="background: #f5f0ff; border-radius: 16px; padding: 20px; margin-bottom: 30px; border: 1px solid #e0d7ff;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="background: #667eea; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 22px;">📊</span>
              </div>
              <div>
                <h4 style="margin: 0 0 5px; color: #1f2937; font-size: 16px;">Daily Returns Accrual</h4>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  Your investment earns ${roi}% daily. Returns are calculated and added automatically.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Button -->
          <div style="text-align: center;">
            <a href="https://althworldglobal.com/investments" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 15px 25px -8px rgba(102, 126, 234, 0.4);">
              Track My Investment →
            </a>
          </div>
          
          <p style="text-align: center; margin: 20px 0 0; color: #9ca3af; font-size: 12px;">
            Created: ${formatDateTime(createdDate)}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">
            Need help? <a href="mailto:support@${appName.toLowerCase()}.com" style="color: #667eea; text-decoration: none; font-weight: 500;">support@${appName.toLowerCase()}.com</a>
          </p>
          <p style="color: #9ca3af; font-size: 10px; margin: 10px 0 0;">
            <a href="#" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
    }
}
exports.MailSender = MailSender;
// Export singleton instance
exports.mailSender = MailSender.getInstance();
