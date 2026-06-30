// adminTransaction.schema.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== ENUMS ====================
export enum AdminTransactionType {
    DEPOSIT = "deposit",
    WITHDRAW = "withdraw",
    INVESTMENT = "investment",
    PROFIT = "profit",
    KYC = "kyc",
}

export enum AdminTransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
}

export enum AdminTransactionConfirmation {
    TRUE = "true",
    FALSE = "false",
    PENDING = "pending",
    FAILED = "failed",
}

// ==================== INTERFACE ====================
export interface IAdminTransaction extends Document {
    userId: mongoose.Types.ObjectId;
    transactionId: mongoose.Types.ObjectId;
    fullName: string;
    userName: string;
    email: string;
    creditedAmount: number;
    type: AdminTransactionType;
    status: AdminTransactionStatus;
    currency: string;
    walletAddress: string | null;
    isConfirmed: AdminTransactionConfirmation;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== SCHEMA ====================
const AdminTransactionSchema = new Schema<IAdminTransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, // ✅ Index for user lookups
        },
        transactionId: {
            type: Schema.Types.ObjectId,
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
    },
    {
        timestamps: true,
    }
);

// ==================== COMPOUND INDEXES ====================
// For efficient querying of common filter combinations
AdminTransactionSchema.index({ userId: 1, type: 1 });
AdminTransactionSchema.index({ userId: 1, status: 1 });
AdminTransactionSchema.index({ userId: 1, createdAt: -1 });
AdminTransactionSchema.index({ type: 1, status: 1 });
AdminTransactionSchema.index({ isConfirmed: 1, status: 1 });
AdminTransactionSchema.index({ createdAt: -1 }); // For sorting by date

// ==================== MODEL ====================
export const AdminTransaction: Model<IAdminTransaction> = mongoose.model<IAdminTransaction>(
    "AdminTransaction",
    AdminTransactionSchema
);

export default AdminTransaction;