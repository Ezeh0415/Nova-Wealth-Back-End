// const nodemailer = require("nodemailer");
// install: npm install node-mailjet
const Mailjet = require("node-mailjet");
const dotenv = require("dotenv");
dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail", // or SMTP host
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE,
);

// VERY IMPORTANT: verify transporter
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ Mailer error:", error);
//   } else {
//     console.log("✅ Mail server is ready");
//   }
// });

// VERY IMPORTANT: verify transporter
mailjet
  .get("user")
  .request()
  .then(() => {
    console.log("✅ Mail server is ready - Connected successfully");
  })
  .catch((error) => {
    console.error("❌ Mail server error:", error.statusCode, error.message);
  });

module.exports = mailjet;
