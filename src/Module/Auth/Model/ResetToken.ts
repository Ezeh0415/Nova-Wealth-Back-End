import mongoose, { Schema, Document, model } from "mongoose";

// ==============================
// INTERFACES
// ==============================

export interface IResetToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    expires: Date;
    createdAt: Date;
    ipAddress?: string;
    userAgent?: string;
    used: boolean | string;
    usedAt?: Date;
    updatedAt: Date;
}

// ==============================
// SCHEMA DEFINITION
// ==============================

const ResetTokenSchema = new Schema<IResetToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
        },
        expires: {
            type: Date,
            required: true,
            index: true,
        },
        createdAt: {
            type: Date,
            default: Date.now, expires: 3600,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        used: {
            type: String,
            default: "",
        },
        usedAt: {
            type: Date,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// ==============================
// INDEXES
// ==============================

// 1. TTL Index - Auto-delete expired tokens after 1 hour
// This will automatically delete documents when createdAt + 3600 seconds passes
ResetTokenSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 86400 } // 24 hour = 86400 seconds
);

// 2. Index for finding by userId (for cleaning up user's tokens)
ResetTokenSchema.index({ userId: 1 });

// 3. Index for finding by token (for verification)
ResetTokenSchema.index({ token: 1 });

// 4. Index for finding by expires (for manual cleanup if needed)
ResetTokenSchema.index({ expires: 1 });

// 5. Compound index for checking valid tokens
ResetTokenSchema.index({ token: 1, used: 1, expires: 1 });

// 6. Index for finding unused tokens by user
ResetTokenSchema.index({ userId: 1, used: 1, createdAt: -1 });


export const ResetTokenModel = model<IResetToken>("ResetToken", ResetTokenSchema);