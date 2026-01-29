// utils/emailTemplates.js

function otpTemplate(link, appName = "AlthWorld") {
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

module.exports = { otpTemplate };
