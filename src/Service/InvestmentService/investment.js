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
    if (
      !userId ||
      !amount ||
      !roi ||
      !investmentType ||
      !investmentStartDate ||
      !investmentEndDate
    ) {
      throw new Error("Invalid input");
    }

    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const wallet = await this.WalletModel.findOne({ userId });
    if (!wallet) {
      throw new Error("User does not exist");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find user - use await
    const user = await this.userModels.findById(userObjectId);
    if (!user) throw new Error("User not found");

    // deduct the amount from the wallet
    const creditedAmountInKobo = amount * 100;
    await this.WalletModel.updateOne(
      { userId },
      { $inc: { balance: -creditedAmountInKobo } },
    );
    const investment = new this.InvestmentModel({
      userId,
      amount: creditedAmountInKobo,
      roi,
      investmentType,
      investmentStartDate,
      investmentEndDate,
    });
    await investment.save();

    const invest = this.AdminTransactionModel.create({
      userId: userObjectId,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      type: "investment",
      creditedAmount: creditedAmountInKobo,
      status: "active",
    });

    if (!invest) {
      throw new Error("invest not found");
    }

    return investment;
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
        amount: profit,
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
