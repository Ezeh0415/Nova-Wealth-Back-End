class WalletService {
  constructor({ WalletModel, TransactionModel, AdminTransactionModel }) {
    this.WalletModel = WalletModel;
    this.TransactionModel = TransactionModel;
    this.AdminTransactionModel = AdminTransactionModel;
  }

  // User requests deposit
  async requestDeposit(userId, amount, currency) {
    if (!userId) throw new Error("User ID is required"); // optional check

    if (!amount || !currency)
      throw new Error("Amount and currency are required");

    const wallet =
      (await this.WalletModel.findOne({ userId })) ||
      (await this.WalletModel.create({ userId, balance: 0, pending: 0 }));

    const creditedAmountInKobo = amount * 100;
    wallet.pending += creditedAmountInKobo; // increase pending amount
    await wallet.save();

    const transaction = await this.TransactionModel.create({
      userId,
      type: "deposit",
      currency,
      requestedAmount: amount,
      creditedAmount: 0,
      status: "pending",
    });

    await this.AdminTransactionModel.create({
      userId,
      creditedAmount: amount,
      currency,
      transactionId: transaction._id,
    });

    return transaction;
  }

  async AdminGetTransaction(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const transactions = await this.AdminTransactionModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.AdminTransactionModel.countDocuments();

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      transactions,
    };
  }

  // Admin confirms deposit (partial or full)
  async confirmDeposit(userId, creditedAmount, transactionId) {
    const adminTransaction = await this.AdminTransactionModel.findOne({
      transactionId,
    });
    if (!adminTransaction) throw new Error("Admin transaction not found");
    if (adminTransaction.isConfirmed === "true")
      throw new Error("Transaction already confirmed");
    const wallet = await this.WalletModel.findOne({ userId });
    if (!wallet) throw new Error("Wallet not found");

    const transaction = await this.TransactionModel.findById(transactionId);
    if (!transaction) throw new Error("Transaction not found");

    // Reduce pending, increase balance
    const creditedAmountInKobo = creditedAmount * 100;

    wallet.pending -= creditedAmountInKobo;
    wallet.balance += creditedAmountInKobo;

    await wallet.save();

    transaction.requestedAmount -= creditedAmount;
    transaction.creditedAmount = creditedAmount;
    transaction.status =
      creditedAmount < transaction.requestedAmount ? "pending" : "completed";
    await transaction.save();

    adminTransaction.isConfirmed = "true";
    await adminTransaction.save();

    return wallet;
  }

  async cancleDeposit(userId, transactionId) {
    const adminTransaction = await this.AdminTransactionModel.findOne({
      transactionId,
    });
    if (!adminTransaction) throw new Error("Admin transaction not found");
    if (adminTransaction.isConfirmed === "true")
      throw new Error("Transaction already confirmed");

    const transaction = await this.TransactionModel.findById(transactionId);
    if (!transaction) throw new Error("Transaction not found");

    const wallet = await this.WalletModel.findOne({ userId });
    if (!wallet) throw new Error("Wallet not found");

    transaction.status = "canceled";
    await transaction.save();

    // Reduce pending balance

    wallet.pending = 0;

    adminTransaction.isConfirmed = "false";
    await adminTransaction.save();

    return wallet;
  }
}

module.exports = WalletService;
