// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "referral", // Referral related
        "transaction", // Transaction related
        "success", // Successful operations
        "deposit", // Deposit related
        "withdrawal", // Withdrawal related
        "investment", // Investment updates
        "withdrawal_request", // Withdrawal request status
        "bonus", // Bonus earned
        "system", // System announcements
        "security", // Security alerts
        "promotion", // Promotions
        "account", // Account updates
        "signup", // Signup confirmation
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      // Flexible data field for additional information
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: [
        "referral", // Referral related
        "transaction", // Transaction related
        "success", // Successful operations
        "deposit", // Deposit related
        "withdrawal", // Withdrawal related
        "investment", // Investment updates
        "withdrawal_request", // Withdrawal request status
        "bonus", // Bonus earned
        "system", // System announcements
        "security", // Security alerts
        "promotion", // Promotions
        "account", // Account updates
        "signup", // Signup confirmation
      ],
      default: "system",
    },
    actionUrl: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: "bell",
    },
    expiresAt: {
      type: Date,
      default: function () {
        // Notifications expire after 30 days by default
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      },
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
