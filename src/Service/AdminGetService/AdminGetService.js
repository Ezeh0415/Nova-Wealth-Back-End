class AdminGetService {
  constructor({
    userModel,
    WalletModel,
    TransactionModel,
    AdminTransactionModel,
  }) {
    this.userModel = userModel;
    this.WalletModel = WalletModel;
    this.TransactionModel = TransactionModel;
    this.AdminTransactionModel = AdminTransactionModel;
  }

  //   get user  and user wallet
  async getUserAndWallet(userId) {
    try {
      const user = await this.userModel.findById(userId);
      const wallet = await this.WalletModel.findOne({ userId });
      return { user, wallet };
    } catch (error) {
      throw new Error("Error fetching user and wallet");
    }
  }
  // get user transaction
  async getUserTransaction(userId) {
    try {
      const transactions = await this.TransactionModel.find({ userId });
      return transactions;
    } catch (error) {
      throw new Error("Error fetching user transactions");
    }
  }
}
