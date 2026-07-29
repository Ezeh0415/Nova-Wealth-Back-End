import mongoose, { Schema, Document, Model } from "mongoose";

// ==============================
// INTERFACES
// ==============================

interface ICryptoWallet {
    bitcoin: string;
    usdt: string;
    ethereum: string;
    tron: string;
}

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
    ipAddress?: string;
    userAgent?: string;
    softDelete: boolean | string;
    wallets: ICryptoWallet;
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
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false,
        },
        refreshToken: {
            type: String,
            select: false,
        },
        tokenVersion: {
            type: Number,
            default: 0,
        },
        lastTokenRefresh: {
            type: Date,
            default: null,
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
            index: true,
        },
        referralCode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            uppercase: true,
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
            min: 0,
        },
        firstDepositDate: {
            type: Date,
            default: null,
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
            type: Boolean,
            default: false,
        },
        wallets: {
            bitcoin: {
                type: String,
                default: "",
                trim: true,
            },
            usdt: {
                type: String,
                default: "",
                trim: true,
            },
            ethereum: {
                type: String,
                default: "",
                trim: true,
            },
            tron: {
                type: String,
                default: "",
                trim: true,
            },
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


// ==============================
// INSTANCE METHODS
// ==============================

// Compare password (you'll need to implement bcrypt)
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    // Implement with bcrypt
    // const bcrypt = require('bcryptjs');
    // return await bcrypt.compare(candidatePassword, this.password);
    return candidatePassword === this.password; // Placeholder - replace with bcrypt
};

// Check if password needs to be changed
UserSchema.methods.needsPasswordChange = function (): boolean {
    if (!this.passwordChangedAt) return false;
    const daysSinceChange = (Date.now() - this.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceChange > 90; // 90 days
};

// Generate referral code
UserSchema.methods.generateReferralCode = function (): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// ==============================
// STATIC METHODS
// ==============================

interface IUserModel extends Model<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findByUserName(username: string): Promise<IUser | null>;
    findByReferralCode(code: string): Promise<IUser | null>;
    findActiveUsers(): Promise<IUser[]>;
    findInactiveUsers(): Promise<IUser[]>;
    getReferralStats(userId: string): Promise<{
        totalReferrals: number;
        activeReferrals: number;
        totalCommission: number;
    }>;
}

UserSchema.statics.findByEmail = async function (email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
};

UserSchema.statics.findByUserName = async function (username: string): Promise<IUser | null> {
    return this.findOne({ userName: username.toLowerCase().trim() });
};

UserSchema.statics.findByReferralCode = async function (code: string): Promise<IUser | null> {
    return this.findOne({ referralCode: code.toUpperCase().trim() });
};

UserSchema.statics.findActiveUsers = async function (): Promise<IUser[]> {
    return this.find({ isActive: true, softDelete: false });
};

UserSchema.statics.findInactiveUsers = async function (): Promise<IUser[]> {
    return this.find({ isActive: false, softDelete: false });
};

UserSchema.statics.getReferralStats = async function (userId: string): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    totalCommission: number;
}> {
    const referrals = await this.find({ referredBy: userId });
    
    const activeReferrals = referrals.filter((user: IUser) => user.isActive && !user.softDelete);
    
    // Calculate total commission (you'll need to implement this logic)
    const totalCommission = referrals.reduce((sum: number, user: IUser) => {
        // This is a placeholder - implement your commission logic
        return sum + (user.firstDepositAmount || 0) * 0.1;
    }, 0);
    
    return {
        totalReferrals: referrals.length,
        activeReferrals: activeReferrals.length,
        totalCommission,
    };
};

// ==============================
// VIRTUAL PROPERTIES
// ==============================

UserSchema.virtual("isVerified").get(function () {
    return this.KycStatus === "verified";
});

UserSchema.virtual("isPendingKyc").get(function () {
    return this.KycStatus === "pending";
});

UserSchema.virtual("fullNameDisplay").get(function () {
    return this.fullName || this.userName || "User";
});

// Ensure virtuals are included in JSON output
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

// ==============================
// MODEL
// ==============================

// Check if model exists before creating new one
const User = (mongoose.models.User as IUserModel) || 
    mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;