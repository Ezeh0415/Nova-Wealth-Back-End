const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creditedAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    currency: {
      type: String,
      default: "usdt",
    },

    isConfirmed: {
      type: String,
      enum: ["true", "false", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminTransaction", AdminSchema);
