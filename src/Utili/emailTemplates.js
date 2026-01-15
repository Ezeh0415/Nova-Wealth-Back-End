// utils/emailTemplates.js

function otpTemplate(otp, appName = "AlthWorld") {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - OTP Verification</title>
    <style>
      body { font-family: Arial, sans-serif; background-color: #f5f7fa; color: #333; }
      .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 10px; padding: 20px; }
      .header { background-color: #4a90e2; color: white; text-align: center; padding: 20px; font-size: 24px; font-weight: bold; }
      .otp { display: inline-block; background-color: #f0f0f0; color: #4a90e2; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 4px; margin: 20px 0; }
      .footer { text-align: center; font-size: 12px; color: #888888; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">${appName}</div>
      <div style="text-align: center;">
        <h2>OTP Verification</h2>
        <p>Your OTP code is:</p>
        <div class="otp">${otp}</div>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      </div>
      <div class="footer">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
    </div>
  </body>
  </html>
  `;
}

module.exports = { otpTemplate };
