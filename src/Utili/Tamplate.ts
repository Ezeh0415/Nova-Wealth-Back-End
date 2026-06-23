interface WelcomeTemplateOption {
    fullName: string;
    link: string;
    appName: string
}

/**
 * Welcome email template for new users
 * @param fullName - User's full name
 * @param link - Link for user to get started
 * @param appName - Application name (default: "AlthWorld")
 * @returns HTML email template string
 */

function welcomeTemplate(fullName: string, link: string, appName: string = "AlthWorld"): string {
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
          <a href="${link}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Start Your Journey to wealth
          </a>
        </div>
      </div>
    </div>
  `;
}