const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "eligible", "completed", "credited"],
      default: "pending",
    },
    bonusAmount: {
      type: Number,
      default: 1000, // 10 USD in cents
    },
    referralCodeUsed: {
      type: String,
      required: true,
    },
    minDepositRequired: {
      type: Number,
      default: 5000, // 50 USD in cents
    },

    referredUserDeposited: {
      type: Boolean,
      default: false,
    },

    referredUserDepositAmount: {
      type: Number,
      default: 0,
    },

    bonusDistributed: {
      type: Boolean,
      default: false,
    },
    bonusDistributedAt: {
      type: Date,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Referral", referralSchema);
