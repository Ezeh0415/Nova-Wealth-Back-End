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
const ReferralSchema = new mongoose_1.Schema({
    referrer: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    referredUser: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ["pending", "eligible", "completed", "credited"],
        default: "pending",
        index: true,
    },
    bonusAmount: {
        type: Number,
        default: 1000, // 10 USD in cents
    },
    referralCodeUsed: {
        type: String,
        required: true,
        index: true,
    },
    minDepositRequired: {
        type: Number,
        default: 5000, // 50 USD in cents
    },
    referredUserDeposited: {
        type: Boolean,
        default: false,
        index: true,
    },
    referredUserDepositAmount: {
        type: Number,
        default: 0,
    },
    bonusDistributed: {
        type: Boolean,
        default: false,
        index: true,
    },
    bonusDistributedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// ==============================
// INDEXES
// ==============================
// Single field indexes
ReferralSchema.index({ referrer: 1 });
ReferralSchema.index({ referredUser: 1 }, { unique: true });
ReferralSchema.index({ status: 1 });
ReferralSchema.index({ referralCodeUsed: 1 });
ReferralSchema.index({ referredUserDeposited: 1 });
ReferralSchema.index({ bonusDistributed: 1 });
ReferralSchema.index({ createdAt: -1 });
// Compound indexes for common queries
ReferralSchema.index({ referrer: 1, status: 1 });
ReferralSchema.index({ referrer: 1, createdAt: -1 });
ReferralSchema.index({ status: 1, bonusDistributed: 1 });
ReferralSchema.index({ referralCodeUsed: 1, status: 1 });
ReferralSchema.index({ referrer: 1, referredUserDeposited: 1 });
ReferralSchema.statics.findByReferrer = async function (referrerId) {
    return this.find({ referrer: referrerId })
        .populate('referredUser', 'fullName email userName')
        .sort({ createdAt: -1 });
};
ReferralSchema.statics.findByReferredUser = async function (userId) {
    return this.findOne({ referredUser: userId })
        .populate('referrer', 'fullName email userName referralCode');
};
ReferralSchema.statics.findByReferralCode = async function (code) {
    return this.find({ referralCodeUsed: code })
        .populate('referredUser', 'fullName email userName')
        .sort({ createdAt: -1 });
};
ReferralSchema.statics.getReferralStats = async function (referrerId) {
    const stats = await this.aggregate([
        { $match: { referrer: new mongoose_1.default.Types.ObjectId(referrerId) } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                eligible: { $sum: { $cond: [{ $eq: ["$status", "eligible"] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                credited: { $sum: { $cond: [{ $eq: ["$status", "credited"] }, 1, 0] } },
                totalBonus: { $sum: { $cond: [{ $eq: ["$bonusDistributed", true] }, "$bonusAmount", 0] } },
            },
        },
    ]);
    return stats[0] || {
        total: 0,
        pending: 0,
        eligible: 0,
        completed: 0,
        credited: 0,
        totalBonus: 0,
    };
};
ReferralSchema.statics.markDepositComplete = async function (referralId, depositAmount) {
    const referral = await this.findById(referralId);
    if (!referral) {
        throw new Error("Referral not found");
    }
    // Update deposit info
    referral.referredUserDeposited = true;
    referral.referredUserDepositAmount = depositAmount;
    // Check if deposit meets minimum requirement
    if (depositAmount >= referral.minDepositRequired) {
        referral.status = "eligible";
    }
    else {
        referral.status = "completed";
    }
    await referral.save();
    return referral;
};
ReferralSchema.statics.distributeBonus = async function (referralId) {
    const referral = await this.findById(referralId);
    if (!referral) {
        throw new Error("Referral not found");
    }
    if (referral.status !== "eligible") {
        throw new Error("Referral is not eligible for bonus");
    }
    if (referral.bonusDistributed) {
        throw new Error("Bonus already distributed");
    }
    // Update status to credited
    referral.status = "credited";
    referral.bonusDistributed = true;
    referral.bonusDistributedAt = new Date();
    await referral.save();
    return referral;
};
// ==============================
// INSTANCE METHODS
// ==============================
ReferralSchema.methods.isEligibleForBonus = function () {
    return this.status === "eligible" && !this.bonusDistributed;
};
ReferralSchema.methods.canDistributeBonus = function () {
    return (this.referredUserDeposited &&
        this.referredUserDepositAmount >= this.minDepositRequired &&
        this.status === "eligible" &&
        !this.bonusDistributed);
};
ReferralSchema.methods.toJSON = function () {
    const referral = this.toObject();
    delete referral.__v;
    return referral;
};
// ==============================
// VIRTUAL PROPERTIES
// ==============================
ReferralSchema.virtual('isComplete').get(function () {
    return this.status === 'completed' || this.status === 'credited';
});
ReferralSchema.virtual('bonusEarned').get(function () {
    return this.bonusDistributed ? this.bonusAmount : 0;
});
// ==============================
// MODEL
// ==============================
const Referral = mongoose_1.default.model("Referral", ReferralSchema);
exports.default = Referral;
