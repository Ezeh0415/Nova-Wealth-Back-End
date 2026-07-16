"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// Create the schema
const kycSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Create and export the model
const KYC = mongoose_1.default.model("KYC", kycSchema);
exports.default = KYC;
