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
const WalletSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
    },
    refBonus: {
        type: Number,
        default: 0,
        min: 0,
    },
    pendingInvestment: {
        type: Number,
        default: 0,
        min: 0,
    },
    invBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    pendingWithdraw: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalDeposits: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalWithdrawals: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalReturn: {
        type: Number,
        default: 0,
        min: 0,
    },
    pending: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
});
// ==============================
// INDEXES
// ==============================
// Single field indexes
WalletSchema.index({ userId: 1 }, { unique: true });
WalletSchema.index({ balance: 1 });
WalletSchema.index({ pendingInvestment: 1 });
WalletSchema.index({ pendingWithdraw: 1 });
WalletSchema.index({ totalDeposits: 1 });
WalletSchema.index({ createdAt: -1 });
// Compound indexes for common queries
WalletSchema.index({ userId: 1, balance: 1 });
WalletSchema.index({ userId: 1, totalDeposits: 1 });
WalletSchema.statics.findByUserId = async function (userId) {
    return this.findOne({ userId });
};
WalletSchema.statics.getWalletBalance = async function (userId) {
    const wallet = await this.findOne({ userId });
    return wallet?.balance || 0;
};
WalletSchema.statics.getTotalBalance = async function (userId) {
    const wallet = await this.findOne({ userId });
    if (!wallet)
        return 0;
    return wallet.balance + wallet.refBonus + wallet.invBalance;
};
WalletSchema.statics.addBalance = async function (userId, amount) {
    if (amount < 0) {
        throw new Error("Amount must be positive");
    }
    return this.findOneAndUpdate({ userId }, { $inc: { balance: amount } }, { new: true });
};
WalletSchema.statics.deductBalance = async function (userId, amount) {
    if (amount < 0) {
        throw new Error("Amount must be positive");
    }
    const wallet = await this.findOne({ userId });
    if (!wallet) {
        throw new Error("Wallet not found");
    }
    if (wallet.balance < amount) {
        throw new Error("Insufficient balance");
    }
    return this.findOneAndUpdate({ userId }, { $inc: { balance: -amount } }, { new: true });
};
// ==============================
// INSTANCE METHODS
// ==============================
WalletSchema.methods.getAvailableBalance = function () {
    return this.balance + this.refBonus;
};
WalletSchema.methods.getTotalBalance = function () {
    return this.balance + this.refBonus + this.invBalance;
};
WalletSchema.methods.getLockedBalance = function () {
    return this.pendingInvestment + this.pendingWithdraw;
};
WalletSchema.methods.canWithdraw = function (amount) {
    return (this.balance + this.refBonus) >= amount;
};
WalletSchema.methods.canInvest = function (amount) {
    return (this.balance + this.refBonus) >= amount;
};
WalletSchema.methods.toJSON = function () {
    const wallet = this.toObject();
    delete wallet.__v;
    return wallet;
};
// ==============================
// VIRTUAL PROPERTIES
// ==============================
WalletSchema.virtual('totalBalance').get(function () {
    return this.balance + this.refBonus + this.invBalance;
});
WalletSchema.virtual('availableBalance').get(function () {
    return this.balance + this.refBonus;
});
WalletSchema.virtual('lockedBalance').get(function () {
    return this.pendingInvestment + this.pendingWithdraw;
});
// ==============================
// MODEL
// ==============================
const Wallet = mongoose_1.default.model("Wallet", WalletSchema);
exports.default = Wallet;
