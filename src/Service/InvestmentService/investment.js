const { default: mongoose } = require("mongoose");
const userModels = require("../../Models/UserSchema");
class InvestmentService {
  constructor({AdminTransactionModel, InvestmentModel, WalletModel }) {
    this.AdminTransactionModel = AdminTransactionModel;
    this.InvestmentModel = InvestmentModel;
    this.WalletModel = WalletModel;
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

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find user - use await
    const user = await userModels.findOne({ _id: userObjectId });
    if (!user) throw new Error("User not found");

    await this.AdminTransactionModel.create({
      userId: userObjectId,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      type: "investment",
      creditedAmount: creditedAmountInKobo,
      currency: currency.toUpperCase(),
      status: "active",
      transactionId: transaction._id,
    });

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

      inv.totalReturns = (inv.totalReturns || 0) + profit;
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
    const investment = await this.Investment.findById(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    if (investment.investmentStatus !== "active") {
      return; // silently ignore or log
    }

    const wallet = await this.Wallet.findOne({
      userId: investment.userId,
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Return capital + ROI
    wallet.balance += investment.amount + investment.invBalance;
    wallet.totalReturn += investment.invBalance;
    wallet.invBalance = 0;

    await wallet.save();

    investment.investmentStatus = "completed";
    investment.investmentEndDate = new Date();

    await investment.save();

    return investment;
  }
}

module.exports = InvestmentService;
