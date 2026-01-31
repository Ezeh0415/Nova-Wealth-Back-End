const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
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
    enum: ["pending", "completed", "credited"],
    default: "pending",
  },
  amount: {
    type: Number,
    default: "",
  },
  referralCodeUsed: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  creditedAt: {
    type: Date,
  },
}, { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);
