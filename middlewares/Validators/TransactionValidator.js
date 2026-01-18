const { body } = require("express-validator");
const mongoose = require("mongoose");

exports.creditTransactionValidator = [
  // Id
  body("adminId")
    .exists()
    .withMessage("admin ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid admin ID"),

  body("userId")
    .exists()
    .withMessage("User ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid user ID"),

  // creditedAmount
  body("creditedAmount")
    .exists()
    .withMessage("Credited amount is required")
    .isInt({ min: 1 })
    .withMessage("Credited amount must be a positive integer"),

  // transactionId
  body("transactionId")
    .exists()
    .withMessage("transactionId is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid transactionId"),
];
