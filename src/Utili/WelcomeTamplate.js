function welcomeTemplate(fullName, link, appName = "AlthWorld") {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #10b981; color: white; padding: 40px 20px; text-align: center;">
        <h1 style="margin: 0;">Welcome to ${appName}!</h1>
        <p style="opacity: 0.9; margin-top: 10px;">Your Wellness Journey Begins Here</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #065f46;">Hello ${fullName},</h2>
        <p>We're excited to have you join the ${appName} community! Your journey to holistic wellness starts now.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href=${link} style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Start Your Journey to wealth
          </a>
        </div>
      </div>
    </div>
  `;
}

module.exports = { welcomeTemplate };


// function simpleAdminNotificationTemplate(newUserName, userEmail, appName = "AlthWorld") {
//   return `
//     <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
//       <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
//         <h3 style="margin: 0;">📋 New User Registration</h3>
//       </div>
      
//       <div style="padding: 20px;">
//         <p><strong>New user signed up:</strong></p>
        
//         <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0;">
//           <p><strong>Name:</strong> ${newUserName}</p>
//           <p><strong>Email:</strong> ${userEmail}</p>
//           <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
//         </div>
        
//         <a href="/admin/users" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
//           Manage Users
//         </a>
//       </div>
//     </div>
//   `;
// }

// // Example usage:
// const simpleEmail = simpleAdminNotificationTemplate(
//   "John Smith",
//   "john@example.com",
//   "AlthWorld"
// );