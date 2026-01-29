const mongoose = require("mongoose");

const ResetTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // Token expires after 1 hour
  ipAddress: { type: String },
  userAgent: { type: String },
  used: { type: String, default: "" },
  usedAt: { type: Date, default: "" },
});

// Add index for automatic cleanup
ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ResetToken", ResetTokenSchema); // Export the ResetToken model
