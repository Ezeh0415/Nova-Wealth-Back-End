const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // or SMTP host
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// VERY IMPORTANT: verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer error:", error);
  } else {
    console.log("✅ Mail server is ready");
  }
});

module.exports = transporter;
