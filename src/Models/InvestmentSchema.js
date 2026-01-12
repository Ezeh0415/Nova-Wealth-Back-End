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
    lastRoiAt: {
      type: Date,
      default: null,
    },
    investmentType: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
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
    investmentStatus: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Investment", investmentSchema);
