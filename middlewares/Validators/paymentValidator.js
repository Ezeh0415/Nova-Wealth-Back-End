const { body } = require("express-validator");

exports.paymentValidator = [
  // amount
  body("amount")
    .exists()
    .withMessage("Amount is required")
    .isInt({ min: 1 })
    .withMessage("Amount must be a positive integer"),

  // paymentType
  body("paymentType")
    .exists()
    .withMessage("Payment Method is required")
    .isString()
    .withMessage("Payment Method must be a string")
    .trim()
    .withMessage("Payment Method must be usdt, btc, or eth"),
];
