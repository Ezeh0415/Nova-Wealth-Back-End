function depositConfirmation(depositData, appName = "AlthWorld") {
  const {
    userId,
    type,
    currency,
    creditedAmount,
    status,
    creditedAt,
    userEmail,
    userFullName,
    transactionId,
    isFirstDeposit,
  } = depositData;

  const depositTime = new Date(creditedAt).toLocaleString();
  const amountInDollars = (creditedAmount / 100).toFixed(2);
  const displayTransactionId =
    transactionId ||
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
          ${
            isFirstDeposit
              ? `
          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 12px; padding: 15px; margin-bottom: 25px; text-align: center;">
            <span style="font-size: 24px; display: block; margin-bottom: 5px;">🎉 ⭐ 🎉</span>
            <p style="margin: 0; color: white; font-weight: 600; font-size: 16px;">Congratulations on your first deposit!</p>
          </div>
          `
              : ""
          }
          ${
            type === "Withdrawal"
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
              : ""
          }
          
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

module.exports = {
  depositConfirmation,
};
