const { body } = require("express-validator");

exports.loginValidator = [
  // userName
  body("userName")
    .exists().withMessage("Username is required")
    .isString().withMessage("Username must be a string")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters")
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage("Username can only contain letters, numbers, _ and .")
    .escape(),

  // password
  body("password")
    .exists().withMessage("Password is required")
    .isString().withMessage("Password must be a string")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/).withMessage("Password must contain a number"),
];
