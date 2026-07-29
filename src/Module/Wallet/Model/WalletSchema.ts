import mongoose, { Schema, Document, Model } from "mongoose";

// ==============================
// INTERFACES
// ==============================

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  refBonus: number;
  pendingInvestment: number;
  invBalance: number;
  pendingWithdraw: number;
  totalWithdrawals: number;
  totalDeposits: number;
  totalReturn: number;
  pending: number;
  createdAt: Date;
  updatedAt: Date;
}  //  REMEMBER TO MAKE INVBALANCE TO TOTAL INVESTED BALANCE

// ==============================
// SCHEMA DEFINITION
// ==============================

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

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

// ==============================
// STATIC METHODS
// ==============================

interface IWalletModel extends Model<IWallet> {
  findByUserId(userId: string): Promise<IWallet | null>;
  getWalletBalance(userId: string): Promise<number>;
  getTotalBalance(userId: string): Promise<number>;
  addBalance(userId: string, amount: number): Promise<IWallet | null>;
  deductBalance(userId: string, amount: number): Promise<IWallet | null>;
}

WalletSchema.statics.findByUserId = async function (userId: string): Promise<IWallet | null> {
  return this.findOne({ userId });
};

WalletSchema.statics.getWalletBalance = async function (userId: string): Promise<number> {
  const wallet = await this.findOne({ userId });
  return wallet?.balance || 0;
};

WalletSchema.statics.getTotalBalance = async function (userId: string): Promise<number> {
  const wallet = await this.findOne({ userId });
  if (!wallet) return 0;
  return wallet.balance + wallet.refBonus + wallet.invBalance;
};

WalletSchema.statics.addBalance = async function (userId: string, amount: number): Promise<IWallet | null> {
  if (amount < 0) {
    throw new Error("Amount must be positive");
  }
  return this.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { new: true }
  );
};

WalletSchema.statics.deductBalance = async function (userId: string, amount: number): Promise<IWallet | null> {
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

  return this.findOneAndUpdate(
    { userId },
    { $inc: { balance: -amount } },
    { new: true }
  );
};

// ==============================
// INSTANCE METHODS
// ==============================

WalletSchema.methods.getAvailableBalance = function (): number {
  return this.balance + this.refBonus;
};

WalletSchema.methods.getTotalBalance = function (): number {
  return this.balance + this.refBonus + this.invBalance;
};

WalletSchema.methods.getLockedBalance = function (): number {
  return this.pendingInvestment + this.pendingWithdraw;
};

WalletSchema.methods.canWithdraw = function (amount: number): boolean {
  return (this.balance + this.refBonus) >= amount;
};

WalletSchema.methods.canInvest = function (amount: number): boolean {
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

const Wallet = mongoose.model<IWallet, IWalletModel>("Wallet", WalletSchema);

export default Wallet;