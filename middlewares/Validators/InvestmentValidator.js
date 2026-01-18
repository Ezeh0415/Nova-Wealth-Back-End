const { body } = require("express-validator");

exports.investmentValidator = [
  // amount
  body("amount")
    .exists()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => value > 0)
    .withMessage("Amount must be greater than 0")
    .toInt(),

  body("roi")
    .exists()
    .withMessage("roi is required")
    .isNumeric()
    .withMessage("roi must be a number")
    .custom((value) => value > 0)
    .withMessage("roi must be greater than 0")
    .toInt(),
  
  // investmentType
  body("investmentType")
    .exists()
    .withMessage("Investment type is required")
    .isString()
    .trim()
    .escape()
    .isIn(["basic", "standard", "premium", "ultimate"])
    .withMessage("Invalid investment type"),

  // investmentStartDate
  body("investmentStartDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date")
    .toDate(),

  // investmentEndDate
  body("investmentEndDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date")
    .toDate()
    .custom((end, { req }) => {
      if (req.body.investmentStartDate) {
        return new Date(end) > new Date(req.body.investmentStartDate);
      }
      return true;
    })
    .withMessage("End date must be after start date"),
];
