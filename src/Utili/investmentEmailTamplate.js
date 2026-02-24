function investmentConfirmationTemplate(
  investmentData,
  appName = "AlthWorldGlobal"
) {
  const { 
    _id,
    userId, 
    amount, 
    roi, 
    TotalReturns,
    lastRoiAt,
    investmentType, 
    investmentStatus, 
    investmentStartDate, 
    investmentEndDate,
    createdAt,
    formatType
  } = investmentData;
  
  const startDate = new Date(investmentStartDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const endDate = new Date(investmentEndDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const createdDate = new Date(createdAt).toLocaleString();
  const lastRoiDate = lastRoiAt ? new Date(lastRoiAt).toLocaleString() : 'Not yet calculated';
  
  const amountInDollars = (amount / 100).toFixed(2);
  const returnsInDollars = (TotalReturns / 100).toFixed(2);
  const totalValueInDollars = ((amount + TotalReturns) / 100).toFixed(2);
  
  const investmentId = _id?.toString().slice(-8) || userId.toString().slice(-8) + Date.now().toString().slice(-6);
  
  // Calculate days remaining
  const today = new Date();
  const end = new Date(investmentEndDate);
  const daysRemaining = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
  
  // Format investment type with proper capitalization
  const formattedType = investmentType.charAt(0).toUpperCase() + investmentType.slice(1);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Investment ${formatType} - ${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #667eea20, #764ba220);">
      
      <!-- Main Container -->
      <div style="max-width: 550px; margin: 30px auto; background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(102, 126, 234, 0.4); border: 1px solid rgba(102, 126, 234, 0.1);">
        
        <!-- Purple Gradient Header (different from deposit/withdrawal) -->
        <div style="background: linear-gradient(145deg, #667eea, #764ba2); padding: 40px 30px; text-align: center; position: relative;">
          <!-- Decorative elements -->
          <div style="position: absolute; top: -40px; right: -40px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -40px; left: -40px; width: 180px; height: 180px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
          
          <!-- Investment Icon -->
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
            
            <!-- Stats Grid -->
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
          
          <!-- Progress Bar -->
          <div style="background: #f3f4f6; border-radius: 50px; height: 10px; margin-bottom: 30px; overflow: hidden;">
            <div style="width: ${daysRemaining > 0 ? '70' : '100'}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 50px;"></div>
          </div>
          
          <!-- Investment Details -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #f3f4f6; display: flex; align-items: center; gap: 8px;">
              <span style="background: #667eea; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
              Investment Details
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px;">Plan Type</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; text-align: right; text-transform: capitalize;">${formattedType}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Start Date</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">End Date</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6;">${endDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Days Remaining</td>
                <td style="padding: 10px 0; color: #1f2937; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">${daysRemaining} days</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Total Value</td>
                <td style="padding: 10px 0; color: #667eea; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">$${totalValueInDollars}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 15px; border-top: 1px solid #f3f4f6;">Last ROI Update</td>
                <td style="padding: 10px 0; color: #1f2937; text-align: right; border-top: 1px solid #f3f4f6;">${lastRoiDate}</td>
              </tr>
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
            Created: ${createdDate}
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

module.exports = { 
  investmentConfirmationTemplate 
};