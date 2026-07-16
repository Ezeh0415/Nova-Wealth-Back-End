import mongoose, { Schema, Document, Model } from "mongoose";

// Interface for the document
interface IKYC extends Document {
  userId: mongoose.Types.ObjectId;
  emailVerified: boolean;
  phoneVerified: boolean;
  documentType: string;
  documentNumber: string;
  KycStatus: "unverified" | "verified" | "pending";
  Comments: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const kycSchema: Schema = new mongoose.Schema(
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
  }
);

// Create and export the model
const KYC: Model<IKYC> = mongoose.model<IKYC>("KYC", kycSchema);

export default KYC;