class AdminDashboard {
  constructor({ WalletModel, TransactionModel, InvestmentModel, UserModel }) {
    this.WalletModel = WalletModel;
    this.TransactionModel = TransactionModel;
    this.InvestmentModel = InvestmentModel;
    this.UserModel = UserModel;
  }

  async getAdminDashboardUsers(userId) {
    // confirm if admin
    const isAdmin = await this.UserModel.findById(userId).select("role"); // This should be replaced with actual admin check logic
    if (isAdmin.role !== "admin") {
      throw new Error("Unauthorized access");
    }

    // All users
    const users = await this.UserModel.find().select(
      "fullName userName email role createdAt",
    );
    if (!users) {
      throw new Error("No users found");
    }

    const totalUser = await this.UserModel.countDocuments();
    const totalInvestment = await this.InvestmentModel.countDocuments();
    const investments = await this.InvestmentModel.find();

    return {
      users,
      totalUser,
      totalInvestment,
      investments,
    };
  }

  async getAdminDashBoardWallets(userId) {
    // get all wallets
    const wallets = await this.WalletModel.find({ userId }).select(
      "balance createdAt",
    );
    if (!wallets) {
      throw new Error("No wallets found");
    }

    return {
      wallets,
    };
  }
}

module.exports = AdminDashboard;
