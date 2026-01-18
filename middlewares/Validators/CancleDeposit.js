const { body } = require("express-validator");

exports.CancleDeposit = [
  // userId
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

  // transactionId
  body("transactionId")
    .exists()
    .withMessage("transactionId is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid transactionId"),
];
