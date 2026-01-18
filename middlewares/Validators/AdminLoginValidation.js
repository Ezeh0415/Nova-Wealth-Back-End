const { body } = require("express-validator");

exports.AdminLoginValidator = [
  // email
  body("email")
    .exists()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  // password
  body("password")
    .exists()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter"),
];
