function passwordResetSuccessTemplate(
  appName = "AlthWorld",
  userName = "",
  userEmail = "",
) {
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
            
            ${
              userName || userEmail
                ? `
            <div class="user-info">
                <h3>Account Information</h3>
                ${
                  userName
                    ? `
                <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value">${userName}</div>
                </div>
                `
                    : ""
                }
                ${
                  userEmail
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
            
            <a href="${process.env.FRONTEND_URL}login?key=${process.env.API_KEY}" class="cta-button">
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
                // <p>Need help? <a href="${process.env.FRONTEND_URL}support?key=${process.env.API_KEY}">Contact Support</a></p>
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

module.exports = { passwordResetSuccessTemplate };
