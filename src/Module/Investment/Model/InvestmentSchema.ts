// investment.schema.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ==================== ENUMS ====================
export enum InvestmentType {
    BASIC = "basic",
    STANDARD = "standard",
    PREMIUM = "premium",
    ULTIMATE = "ultimate",
}

export enum InvestmentStatus {
    ACTIVE = "active",
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
}

// ==================== INTERFACE ====================
export interface IInvestment extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    roi: number;
    TotalReturns: number;
    lastRoiAt: Date | null;
    investmentType: InvestmentType;
    investmentStartDate: Date;
    investmentEndDate: Date | null;
    description: string;
    investmentStatus: InvestmentStatus;
    cancelledAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== SCHEMA ====================
const InvestmentSchema = new Schema<IInvestment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        roi: {
            type: Number,
            default: 0,
            min: 0,
        },
        TotalReturns: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastRoiAt: {
            type: Date,
            default: null,
        },
        investmentType: {
            type: String,
            enum: Object.values(InvestmentType),
            required: true,
            index: true,
        },
        investmentStartDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        investmentEndDate: {
            type: Date,
            default: null,
        },
        description: {
            type: String,
            default: "",
        },
        investmentStatus: {
            type: String,
            enum: Object.values(InvestmentStatus),
            default: InvestmentStatus.PENDING,
            index: true,
        },
        cancelledAt: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);

// ==================== INDEXES ====================
// Single field indexes
InvestmentSchema.index({ userId: 1 });
InvestmentSchema.index({ investmentType: 1 });
InvestmentSchema.index({ investmentStatus: 1 });
InvestmentSchema.index({ createdAt: -1 });

// Compound indexes for common queries
InvestmentSchema.index({ userId: 1, investmentStatus: 1 });
InvestmentSchema.index({ userId: 1, investmentType: 1 });
InvestmentSchema.index({ userId: 1, createdAt: -1 });
InvestmentSchema.index({ investmentStatus: 1, investmentType: 1 });
InvestmentSchema.index({ investmentStatus: 1, investmentEndDate: 1 });

// ==================== MODEL ====================
export const Investment: Model<IInvestment> = mongoose.model<IInvestment>(
    "Investment",
    InvestmentSchema
);

export default Investment;