const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    // In User model
    refreshToken: {
      type: String,
      select: false, // Don't return in queries by default
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastTokenRefresh: Date,
    isActive: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    passwordChangedAt: {
      type: Date,
      default: "",
    },
    referredBy: {
      type: String, // Store referral code instead of ObjectId
      default: null,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referralLink: {
      type: String,
      unique: true,
      sparse: true,
    },
    hasMadeFirstDeposit: {
      type: Boolean,
      default: false,
    },
    firstDepositAmount: {
      type: Number,
      default: 0,
    },
    firstDepositDate: {
      type: Date,
    },
    KycStatus: {
      type: String,
      enum: ["unverified", "verified", "pending"],
      default: "unverified",
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },

    softDelete: {
      type: String,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
