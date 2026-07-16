"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// ==============================
// SCHEMA DEFINITION
// ==============================
const UserSchema = new mongoose_1.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    userName: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        select: false, // Don't return in queries by default
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
    lastTokenRefresh: {
        type: Date,
    },
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
        default: null,
    },
    referredBy: {
        type: String,
        default: null,
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    referralLink: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
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
        required: false,
    },
    userAgent: {
        type: String,
        required: false,
    },
    softDelete: {
        type: String,
        default: false,
    },
}, {
    timestamps: true,
});
// ==============================
// INDEXES
// ==============================
// Single field indexes
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ userName: 1 }, { unique: true, sparse: true });
UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
UserSchema.index({ referralLink: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ softDelete: 1 });
UserSchema.index({ KycStatus: 1 });
// Compound indexes
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ referredBy: 1, createdAt: -1 });
// Text search index
UserSchema.index({ fullName: "text", userName: "text", email: "text" }, {
    weights: {
        fullName: 10,
        userName: 5,
        email: 3,
    },
    name: "UserTextSearch",
});
// TTL index for soft delete (optional - auto-delete after 30 days if soft deleted)
UserSchema.index({ softDelete: 1, updatedAt: 1 }, { expireAfterSeconds: 2592000 });
UserSchema.statics.findByEmail = async function (email) {
    return this.findOne({ email: email.toLowerCase().trim() });
};
UserSchema.statics.findByUserName = async function (username) {
    return this.findOne({ userName: username.toLowerCase().trim() });
};
UserSchema.statics.findByReferralCode = async function (code) {
    return this.findOne({ referralCode: code });
};
// ==============================
// MODEL
// ==============================
const User = mongoose_1.default.model("User", UserSchema);
exports.default = User;
