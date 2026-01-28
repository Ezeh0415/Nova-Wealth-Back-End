const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;
  
  // Skip in development if no token (optional)
  if (process.env.NODE_ENV === 'development' && !captchaToken) {
    console.log('⚠️ Skipping reCAPTCHA in development mode');
    return next();
  }
  
  if (!captchaToken) {
    return res.status(400).json({
      success: false,
      message: 'Security token is required'
    });
  }

  try {
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    
    const response = await axios.post(verificationUrl, null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET,
        response: captchaToken
      }
    });

    const { success, score, action } = response.data;
    
    console.log('🔐 reCAPTCHA Verification:', {
      success,
      score,
      action,
      hostname: response.data.hostname,
      timestamp: new Date().toISOString()
    });

    // Check if verification passed
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Security verification failed',
        details: response.data['error-codes'] || []
      });
    }

    // Optional: Check score threshold (0.0 to 1.0)
    // 0.0 = bot, 1.0 = human
    const MINIMUM_SCORE = 0.5; // Adjust as needed
    
    if (score < MINIMUM_SCORE) {
      return res.status(400).json({
        success: false,
        message: 'Suspicious activity detected',
        score: score
      });
    }

    // Store verification data in request for later use
    req.recaptchaData = {
      score,
      action,
      success,
      timestamp: new Date().toISOString()
    };

    next();
    
  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error.message);
    
    // Don't block users if reCAPTCHA service is down
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        message: 'Security service temporarily unavailable'
      });
    }
    
    // In development, allow to proceed
    console.log('⚠️ Allowing request in development despite reCAPTCHA error');
    next();
  }
};

module.exports = verifyRecaptcha;