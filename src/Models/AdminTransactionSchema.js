const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    creditedAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    type: {
      type: String,
      enum: ["deposit", "withdraw", "investment", "profit"],
      required: true,
    },
    status: {
      type: String,
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
  { timestamps: true },
);

module.exports = mongoose.model("AdminTransaction", AdminSchema);
