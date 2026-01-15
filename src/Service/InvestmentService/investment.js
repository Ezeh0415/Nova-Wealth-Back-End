class InvestmentService {
  constructor({ InvestmentModel, WalletModel }) {
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
    investmentEndDate
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
      { $inc: { balance: -creditedAmountInKobo } }
    );
    const investment = new this.InvestmentModel({
      userId,
      amount,
      roi,
      investmentType,
      investmentStartDate,
      investmentEndDate,
    });
    await investment.save();
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
        { $inc: { balance: profit } }
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
    wallet.pending -= investment.roi;
    wallet.balance += investment.amount + investment.roi;

    await wallet.save();

    investment.investmentStatus = "completed";
    investment.investmentEndDate = new Date();

    await investment.save();

    return investment;
  }
}

module.exports = InvestmentService;
