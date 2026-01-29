const rateLimit = require("express-rate-limit");
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: "Too many reset requests, please try again later",
});


module.exports = { resetPasswordLimiter };