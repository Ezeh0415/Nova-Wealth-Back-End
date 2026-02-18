function adminNotificationTemplate(
  newUser,
  appName = "AlthWorld"
) {
  const { fullName, userName, email, ipAddress, userAgent } = newUser;
  const signupTime = new Date().toLocaleString();

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

// Example usage:
// const newUser = {
//   fullName: "John Smith",
//   userName: "john_doe_123",
//   email: "john.smith@example.com",
//   ipAddress: "192.168.1.105",
//   userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
// };

// const adminEmailHtml = adminNotificationTemplate(newUser, "AlthWorld");
// console.log(adminEmailHtml);

module.exports = { 
  adminNotificationTemplate 
};