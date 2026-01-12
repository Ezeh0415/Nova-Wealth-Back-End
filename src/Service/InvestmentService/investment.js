class InvestmentService {
  constructor({ InvestmentModel, WalletModel }) {
    this.InvestmentModel = InvestmentModel;
    this.WalletModel = WalletModel;
  }

  // create investment

  async invest(
    userId,
    amount,
    investmentType,
    investmentStartDate,
    investmentEndDate
  ) {
    if (
      !userId ||
      !amount ||
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
    // this is investment rules
    const INVESTMENT_RULES = {
      daily: {
        intervalMs: 24 * 60 * 60 * 1000,
        rate: 0.02,
      },
      weekly: {
        intervalMs: 7 * 24 * 60 * 60 * 1000,
        rate: 0.04,
      },
      monthly: {
        intervalMs: 30 * 24 * 60 * 60 * 1000,
        rate: 0.06,
      },
      yearly: {
        intervalMs: 365 * 24 * 60 * 60 * 1000,
        rate: 0.08,
      },
    };

    const now = new Date();

    const investments = await this.InvestmentModel.find({
      investmentStatus: "active",
    });

    for (const inv of investments) {
      const rule = INVESTMENT_RULES[inv.investmentType];
      if (!rule) continue;
      const lastRoi = inv.lastRoiAt || inv.investmentStartDate;
      const shouldCreditROI = now - lastRoi >= rule.intervalMs;

      if (shouldCreditROI) {
        const amount = Number(inv.amount);
        const roi = Number(inv.roi) || 0;

        if (!Number.isFinite(amount)) {
          throw new Error("Invalid investment amount");
        }

        const Profit = Math.floor(amount * rule.rate);

        if (Profit > 0) {
          inv.roi = roi + Profit;
          inv.lastRoiAt = now;
          await inv.save();
        }

        const now = new Date();

        if (now >= inv.investmentEndDate && inv.investmentStatus === "active") {
          await this.completeInvestment(inv._id);
          inv.investmentEndDate = now;
          await inv.save();
        }

        await this.WalletModel.updateOne(
          { userId: inv.userId },
          {
            $inc: { invBalance: Profit },
          }
        );
      }
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
