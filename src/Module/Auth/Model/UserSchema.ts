import mongoose, { Schema, Document, Model } from "mongoose";

// ==============================
// INTERFACES
// ==============================

export interface IUser extends Document {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    refreshToken?: string;
    tokenVersion: number;
    lastTokenRefresh?: Date;
    isActive: boolean;
    role: "admin" | "user";
    passwordChangedAt?: Date;
    referredBy?: string | object;
    referralCode?: string;
    referralLink?: string;
    hasMadeFirstDeposit: boolean;
    firstDepositAmount: number;
    firstDepositDate?: Date;
    KycStatus: "unverified" | "verified" | "pending";
    ipAddress: string;
    userAgent: string;
    softDelete: boolean | string;
    createdAt: Date;
    updatedAt: Date;
}

// ==============================
// SCHEMA DEFINITION
// ==============================

const UserSchema = new Schema<IUser>(
    {
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
            required: true,
        },
        userAgent: {
            type: String,
            required: true,
        },
        softDelete: {
            type: String,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

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
UserSchema.index(
    { fullName: "text", userName: "text", email: "text" },
    {
        weights: {
            fullName: 10,
            userName: 5,
            email: 3,
        },
        name: "UserTextSearch",
    }
);

// TTL index for soft delete (optional - auto-delete after 30 days if soft deleted)
UserSchema.index({ softDelete: 1, updatedAt: 1 }, { expireAfterSeconds: 2592000 });

// ==============================
// STATIC METHODS
// ==============================

interface IUserModel extends Model<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findByUserName(username: string): Promise<IUser | null>;
    findByReferralCode(code: string): Promise<IUser | null>;
}

UserSchema.statics.findByEmail = async function (email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
};

UserSchema.statics.findByUserName = async function (username: string): Promise<IUser | null> {
    return this.findOne({ userName: username.toLowerCase().trim() });
};

UserSchema.statics.findByReferralCode = async function (code: string): Promise<IUser | null> {
    return this.findOne({ referralCode: code });
};

// ==============================
// MODEL
// ==============================

const User = mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;