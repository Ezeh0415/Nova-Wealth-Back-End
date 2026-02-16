const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    roi: {
      type: Number,
      default: 0,
    },
    TotalReturns: {
      type: Number,
      default: 0,
    },
    lastRoiAt: {
      type: Date,
      default: null,
    },
    investmentType: {
      type: String,
      enum: ["basic", "standard", "premium", "ultimate"],
      required: true,
    },
    investmentStartDate: {
      type: Date,
      default: Date.now,
    },
    investmentEndDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: "",
    },
    investmentStatus: {
      type: String,
      enum: ["active", "pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Investment", investmentSchema);
