const { default: mongoose } = require("mongoose");
class InvestmentService {
  constructor({
    userModels,
    AdminTransactionModel,
    InvestmentModel,
    WalletModel,
    TransactionModel,
  }) {
    this.userModels = userModels;
    this.AdminTransactionModel = AdminTransactionModel;
    this.InvestmentModel = InvestmentModel;
    this.WalletModel = WalletModel;
    this.TransactionModel = TransactionModel;
  }

  // create investment

  async invest(
    userId,
    amount,
    roi,
    investmentType,
    investmentStartDate,
    investmentEndDate,
  ) {
    try {
      // Validate inputs
      if (
        !userId ||
        !amount ||
        !roi ||
        !investmentType ||
        !investmentStartDate ||
        !investmentEndDate
      ) {
        throw new Error("All fields are required");
      }

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Convert userId to ObjectId
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Find user
      const user = await this.userModels.findById(userObjectId);
      if (!user) {
        throw new Error("User not found");
      }

      // Find wallet
      const wallet = await this.WalletModel.findOne({ userId: userObjectId });
      if (!wallet) {
        throw new Error("Wallet not found for user");
      }

      // Convert amount to kobo (cents)
      const creditedAmountInKobo = amount * 100;

      // Check balance
      if (wallet.balance < creditedAmountInKobo) {
        throw new Error(
          `Insufficient balance. Available: $${wallet.balance / 100}, Required: $${amount}`,
        );
      }

      // Deduct the amount from the wallet
      await this.WalletModel.updateOne(
        { userId: userObjectId }, // Fixed: should be userId, not userObjectId
        { $inc: { balance: -creditedAmountInKobo } },
      );

      // Create investment
      const investment = new this.InvestmentModel({
        userId: userObjectId,
        amount: creditedAmountInKobo, // Store in kobo
        roi,
        investmentType,
        investmentStartDate: new Date(investmentStartDate),
        investmentEndDate: new Date(investmentEndDate),
        status: "active",
      });

      await investment.save();

      // Create transaction record
      const transaction = new this.TransactionModel({
        userId: userObjectId,
        type: "investment",
        creditedAmount: creditedAmountInKobo,
        description: `New investment in ${investmentType} plan`,
        status: "active",
      });

      await transaction.save();

      // Create admin transaction record
      const adminTransaction = new this.AdminTransactionModel({
        userId: userObjectId,
        transactionId: investment._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        type: "investment",
        creditedAmount: creditedAmountInKobo,
        status: "active",
      });

      await adminTransaction.save();

      // Return success response
      return {
        success: true,
        message: "Investment created successfully",
        investment: {
          id: investment._id,
          amount: investment.amount / 100, // Return in dollars
          roi: investment.roi,
          type: investment.investmentType,
          startDate: investment.investmentStartDate,
          endDate: investment.investmentEndDate,
          status: investment.status,
        },
        wallet: {
          newBalance: (wallet.balance - creditedAmountInKobo) / 100,
        },
      };
    } catch (error) {
      console.error("❌ Investment creation error:", error.message);
      throw error;
    }
  }

  /**
   * Daily ROI processing (2%)
   */

  async processDailyROI() {
    const DAILY_INTERVAL = 24 * 60 * 60 * 1000;

    const PLAN_RATES = {
      basic: 0.02,
      standard: 0.04,
      premium: 0.06,
      ultimate: 0.08,
    };

    const now = new Date();

    const investments = await this.InvestmentModel.find({
      investmentStatus: "active",
    });

    for (const inv of investments) {
      const rate = PLAN_RATES[inv.investmentType];
      if (!rate) continue;

      const lastRun = inv.lastRoiAt || inv.investmentStartDate;

      // 🔒 Prevent double credit
      if (now - lastRun < DAILY_INTERVAL) continue;

      // ⛔ Stop if investment expired
      if (now >= inv.investmentEndDate) {
        await this.completeInvestment(inv._id);
        continue;
      }

      const amount = Number(inv.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const profit = amount * rate; // NO rounding

      // Update investment

      inv.TotalReturns = (inv.TotalReturns || 0) + profit;
      inv.lastRoiAt = now;
      await inv.save();

      // Credit wallet
      await this.WalletModel.updateOne(
        { userId: inv.userId },
        { $inc: { invBalance: profit } },
      );

      // Transaction record (VERY IMPORTANT)
      await this.TransactionModel.create({
        userId: inv.userId,
        investmentId: inv._id,
        type: "profit",
        creditedAmount: profit,
        description: "Daily investment ROI",
      });
    }
  }

  async completeInvestment(investmentId) {
    const investment = await this.InvestmentModel.findById(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    if (investment.investmentStatus !== "active") {
      return; // silently ignore or log
    }

    const wallet = await this.WalletModel.findOne({
      userId: investment.userId,
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const transaction = await this.TransactionModel.find({
      userId: investment.userId,
    });

    // Return capital + ROI
    wallet.balance += investment.amount + wallet.invBalance;
    wallet.totalReturn += wallet.invBalance;
    wallet.invBalance = 0;

    await wallet.save();

    investment.investmentStatus = "completed";
    investment.investmentEndDate = new Date();

    await investment.save();

    transaction.status = "completed";

    await transaction.save();

    return investment;
  }
}

module.exports = InvestmentService;
