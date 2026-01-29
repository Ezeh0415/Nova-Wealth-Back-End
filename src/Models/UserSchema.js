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
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
      default: true,
    },
    otp: {
      type: String,
      default: "",
    },
    otpExpires: {
      type: Date,
      default: "",
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
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
