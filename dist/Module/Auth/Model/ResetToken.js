"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetTokenModel = void 0;
const mongoose_1 = require("mongoose");
// ==============================
// SCHEMA DEFINITION
// ==============================
const ResetTokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// ==============================
// INDEXES
// ==============================
// 1. TTL Index - Auto-delete expired tokens after 1 hour
// This will automatically delete documents when createdAt + 86400 seconds passes
ResetTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 } // 24 hour = 86400 seconds
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
exports.ResetTokenModel = (0, mongoose_1.model)("ResetToken", ResetTokenSchema);
