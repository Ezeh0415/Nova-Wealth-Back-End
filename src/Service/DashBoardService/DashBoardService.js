class DashboardService {
  constructor({ WalletModel, TransactionModel, InvestmentModel, UserModel }) {
    this.WalletModel = WalletModel;
    this.TransactionModel = TransactionModel;
    this.InvestmentModel = InvestmentModel;
    this.UserModel = UserModel;
  }

  async getDashboard(userId) {
    // Wallet
    const wallet = (await this.WalletModel.findOne({ userId })) || {
      balance: 0,
    };

    // Investments
    const investments = await this.InvestmentModel.find({ userId });

    // Latest Transactions
    const transactions = await this.TransactionModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Profits
    const profits = transactions
      .filter((t) => t.type === "profit")
      .reduce((sum, t) => sum + t.amount, 0);

    // Account Status
    const user = await this.UserModel.findById(userId).select("isVerified");

    return {
      wallet,
      investments,
      transactions,
      profits,
      accountStatus: user,
    };
  }
}

module.exports = DashboardService;
