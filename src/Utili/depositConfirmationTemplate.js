function depositConfirmationTemplate(
  depositData,
  appName = "AlthWorld"
) {
  const { 
    userId, 
    type, 
    currency, 
    requestedAmount, 
    status, 
    initiatedAt, 
    userEmail, 
    userFullName 
  } = depositData;
  
  const depositTime = new Date(initiatedAt).toLocaleString();
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

module.exports = { 
  depositConfirmationTemplate 
};