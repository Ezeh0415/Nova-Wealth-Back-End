const mongoose = require("mongoose");
// models/KYC.js - SIMPLIFIED
const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ============= ONLY THESE ARE ESSENTIAL =============
    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    // ============= OPTIONAL (Only if needed) =============
    // Government ID (Only for high-value or regulated products)
    documentType: {
      type: String,
      default: "",
      verified: { type: Boolean, default: false },
    },

    documentNumber: {
      type: String,
      default: "",
      verified: { type: Boolean, default: false },
    },

    // ============= KYC STATUS =============
    KycStatus: {
      type: String,
      enum: ["unverified", "verified", "pending"],
      default: "unverified",
    },

    Comments: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("KYC", kycSchema);
