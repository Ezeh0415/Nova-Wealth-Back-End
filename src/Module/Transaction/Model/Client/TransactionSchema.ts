import mongoose, { Schema, Document, Model } from "mongoose";

export enum PaymentType {
    DEPOSIT = "deposit",
    WITHDRAW = "withdraw",
    INVESTMENT = "investment",
    PROFIT = "profit"

}

export enum PaymentStatus {
    ACTIVE = "active",
    CANCELLED = "cancelled",
    PENDING = "pending",
    COMPLETED = "completed"
}

export interface ITransaction extends Document {
    userId: object;
    transactionId: object;
    type: PaymentType;
    currency: string;
    requestedAmount: number;
    creditedAmount: number;
    status: PaymentStatus;
    createdAt: Date;
    userEmail: string;
    userFullName: string;
    description: string;
    uniqueId: string;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        type: {
            type: String,
            enum: Object.values(PaymentType),
            required: true,
        },
        currency: { type: String, default: "USDT" },
        requestedAmount: { type: Number }, // what user requested
        creditedAmount: { type: Number }, // what admin actually credited
        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING,
        },
        createdAt: { type: Date, default: Date.now },
        userEmail: {
            type: String,
        },
        userFullName: { type: String },
        description: { type: String },
        uniqueId: { type: String },
    }
)

const TransactionModel = mongoose.model<ITransaction>("Transaction", TransactionSchema)

export default TransactionModel;