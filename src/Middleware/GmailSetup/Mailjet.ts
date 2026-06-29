import Mailjet from "node-mailjet";
import { AppConfig } from "../../config/Config";

export class MailSender {
  private static instance: MailSender;
  private config: AppConfig;
  private mailjetClient: any; // Store the client instance

  private constructor() {
    this.config = AppConfig.getInstance();
    this.mailjetClient = Mailjet.apiConnect(
      this.config.MJ_APIKEY_PUBLIC,
      this.config.MJ_APIKEY_PRIVATE
    );
    this.checkConnection(); // Optional: check connection on init
  }

  public static getInstance(): MailSender {
    if (!MailSender.instance) {
      MailSender.instance = new MailSender();
    }
    return MailSender.instance;
  }

  // Get the mailjet client instance
  public getClient(): any {
    return this.mailjetClient;
  }

  // Optional: Check connection
  private async checkConnection(): Promise<void> {
    try {
      await this.mailjetClient
        .get("user")
        .request();
      console.log(" Mail server is ready - Connected successfully");
    } catch (error: any) {
      console.error(" Mail server error:", error.statusCode, error.message);
    }
  }

  // Send email
  public async sendEmail(to: string, subject: string, html: string): Promise<any> {
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
    } catch (error: any) {
      console.error(" Failed to send email:", error.message);
      throw error;
    }
  }

  // Send welcome email
  public async sendWelcomeEmail(to: string, fullName: string, link: string): Promise<any> {
    const html = this.welcomeTemplate(fullName, link);
    return this.sendEmail(to, "WELCOME TO ALTHWORLD-GLOBAL!", html);
  }

  // admin welcome email
  public async sendAdminWelcomEmail(to: string, fullName: string, userName: string, email: string, ipAddress: string, userAgent: string): Promise<any> {
    const html = this.adminWelcomeTemplate(fullName, userName, email, ipAddress, userAgent)
    return this.sendEmail(to, `New User Registration: ${userName}`, html);
  }

  // send forggoten password email 
  public async sendOtpEmail(to: string, link: string): Promise<any> {
    const html = this.resertPasswordEmail(link);
    return this.sendEmail(to, "Your secure password reset link", html);
  }

  public async sendPasswordChangeEmail(to: string, userName: string, userEmail: string): Promise<any> {
    const html = this.passwordResetSuccess(userName, userEmail);
    return this.sendEmail(to, "password changed successfully", html);
  }

  // Email templates
  private welcomeTemplate(fullName: string, link: string): string {
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

  private adminWelcomeTemplate(fullName: string, userName: string, email: string, ipAddress: string, userAgent: string): string {
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

  private resertPasswordEmail(link: string, appName: string = "ALTHWORLD-GLOBAL"): string {
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

  private passwordResetSuccess(userName: string, userEmail: string, appName: string = "ALTHWORLD-GLOBAL"): string {
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
          : ""
        }
                ${userEmail
          ? `
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${userEmail}</div>
                </div>
                `
          : ""
        }
            </div>
            `
        : ""
      }
            
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
                <p>Password reset completed on: ${new Date().toLocaleString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        },
      )}</p>
            </div>
            
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
  }
}

// Export singleton instance
export const mailSender = MailSender.getInstance();