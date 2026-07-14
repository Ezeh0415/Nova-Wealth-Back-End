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
exports.AdminTransaction = exports.AdminTransactionConfirmation = exports.AdminTransactionStatus = exports.AdminTransactionType = void 0;
// adminTransaction.schema.ts
const mongoose_1 = __importStar(require("mongoose"));
// ==================== ENUMS ====================
var AdminTransactionType;
(function (AdminTransactionType) {
    AdminTransactionType["DEPOSIT"] = "deposit";
    AdminTransactionType["WITHDRAW"] = "withdraw";
    AdminTransactionType["INVESTMENT"] = "investment";
    AdminTransactionType["PROFIT"] = "profit";
    AdminTransactionType["KYC"] = "kyc";
})(AdminTransactionType || (exports.AdminTransactionType = AdminTransactionType = {}));
var AdminTransactionStatus;
(function (AdminTransactionStatus) {
    AdminTransactionStatus["PENDING"] = "pending";
    AdminTransactionStatus["COMPLETED"] = "completed";
    AdminTransactionStatus["FAILED"] = "failed";
    AdminTransactionStatus["CANCELLED"] = "cancelled";
    AdminTransactionStatus["ACTIVE"] = "active";
})(AdminTransactionStatus || (exports.AdminTransactionStatus = AdminTransactionStatus = {}));
var AdminTransactionConfirmation;
(function (AdminTransactionConfirmation) {
    AdminTransactionConfirmation["TRUE"] = "true";
    AdminTransactionConfirmation["FALSE"] = "false";
    AdminTransactionConfirmation["PENDING"] = "pending";
    AdminTransactionConfirmation["FAILED"] = "failed";
})(AdminTransactionConfirmation || (exports.AdminTransactionConfirmation = AdminTransactionConfirmation = {}));
// ==================== SCHEMA ====================
const AdminTransactionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true, // ✅ Index for user lookups
    },
    transactionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Transaction",
        required: true,
        index: true, // ✅ Index for transaction lookups
    },
    fullName: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
        index: true, // ✅ Index for username searches
    },
    email: {
        type: String,
        required: true,
        index: true, // ✅ Index for email searches
    },
    creditedAmount: {
        type: Number,
        required: true,
        default: 0,
    },
    type: {
        type: String,
        enum: Object.values(AdminTransactionType),
        required: true,
        index: true, // ✅ Index for type filtering
    },
    status: {
        type: String,
        enum: Object.values(AdminTransactionStatus),
        default: AdminTransactionStatus.PENDING,
        index: true, // ✅ Index for status filtering
    },
    currency: {
        type: String,
        default: "usdt",
    },
    walletAddress: {
        type: String,
        default: null,
    },
    isConfirmed: {
        type: String,
        enum: Object.values(AdminTransactionConfirmation),
        default: AdminTransactionConfirmation.PENDING,
        index: true, // ✅ Index for confirmation status
    },
    investmentType: {
        type: String,
        index: true,
    }
}, {
    timestamps: true,
});
// ==================== COMPOUND INDEXES ====================
// For efficient querying of common filter combinations
AdminTransactionSchema.index({ userId: 1, type: 1 });
AdminTransactionSchema.index({ userId: 1, status: 1 });
AdminTransactionSchema.index({ userId: 1, createdAt: -1 });
AdminTransactionSchema.index({ type: 1, status: 1 });
AdminTransactionSchema.index({ isConfirmed: 1, status: 1 });
AdminTransactionSchema.index({ createdAt: -1 }); // For sorting by date
// ==================== MODEL ====================
exports.AdminTransaction = mongoose_1.default.model("AdminTransaction", AdminTransactionSchema);
exports.default = exports.AdminTransaction;
