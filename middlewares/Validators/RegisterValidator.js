const { body } = require("express-validator");

exports.registerValidator = [
  // fullName
  body("fullName")
    .exists()
    .withMessage("Full name is required")
    .isString()
    .withMessage("Full name must be a string")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Full name must be 3–50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),

  // userName
  body("userName")
    .exists()
    .withMessage("Username is required")
    .isString()
    .withMessage("Username must be a string")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters")
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage("Username can only contain letters, numbers, _ and ."),

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
