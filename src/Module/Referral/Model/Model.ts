import mongoose, { Schema, Document, Model } from "mongoose";

// ==============================
// INTERFACES
// ==============================

export interface IReferral extends Document {
  referrer: mongoose.Types.ObjectId;
  referredUser: mongoose.Types.ObjectId;
  status: "pending" | "eligible" | "completed" | "credited";
  bonusAmount: number;
  referralCodeUsed: string;
  minDepositRequired: number;
  referredUserDeposited: boolean;
  referredUserDepositAmount: number;
  bonusDistributed: boolean;
  bonusDistributedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==============================
// SCHEMA DEFINITION
// ==============================

const ReferralSchema = new Schema<IReferral>(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

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

// Compound unique index (optional - to prevent duplicate referrals)
// ReferralSchema.index({ referrer: 1, referredUser: 1 }, { unique: true });

// TTL index for cleaning up old pending referrals (optional)
// ReferralSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days


// ==============================
// STATIC METHODS
// ==============================

interface IReferralModel extends Model<IReferral> {
  findByReferrer(referrerId: string): Promise<IReferral[]>;
  findByReferredUser(userId: string): Promise<IReferral | null>;
  findByReferralCode(code: string): Promise<IReferral[]>;
  getReferralStats(referrerId: string): Promise<{
    total: number;
    pending: number;
    eligible: number;
    completed: number;
    credited: number;
    totalBonus: number;
  }>;
  markDepositComplete(referralId: string, depositAmount: number): Promise<IReferral | null>;
  distributeBonus(referralId: string): Promise<IReferral | null>;
}

ReferralSchema.statics.findByReferrer = async function (referrerId: string): Promise<IReferral[]> {
  return this.find({ referrer: referrerId })
    .populate('referredUser', 'fullName email userName')
    .sort({ createdAt: -1 });
};

ReferralSchema.statics.findByReferredUser = async function (userId: string): Promise<IReferral | null> {
  return this.findOne({ referredUser: userId })
    .populate('referrer', 'fullName email userName referralCode');
};

ReferralSchema.statics.findByReferralCode = async function (code: string): Promise<IReferral[]> {
  return this.find({ referralCodeUsed: code })
    .populate('referredUser', 'fullName email userName')
    .sort({ createdAt: -1 });
};

ReferralSchema.statics.getReferralStats = async function (referrerId: string) {
  const stats = await this.aggregate([
    { $match: { referrer: new mongoose.Types.ObjectId(referrerId) } },
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

ReferralSchema.statics.markDepositComplete = async function (
  referralId: string,
  depositAmount: number
): Promise<IReferral | null> {
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
  } else {
    referral.status = "completed";
  }
  
  await referral.save();
  return referral;
};

ReferralSchema.statics.distributeBonus = async function (referralId: string): Promise<IReferral | null> {
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

ReferralSchema.methods.isEligibleForBonus = function (): boolean {
  return this.status === "eligible" && !this.bonusDistributed;
};

ReferralSchema.methods.canDistributeBonus = function (): boolean {
  return (
    this.referredUserDeposited &&
    this.referredUserDepositAmount >= this.minDepositRequired &&
    this.status === "eligible" &&
    !this.bonusDistributed
  );
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

const Referral = mongoose.model<IReferral, IReferralModel>("Referral", ReferralSchema);

export default Referral;