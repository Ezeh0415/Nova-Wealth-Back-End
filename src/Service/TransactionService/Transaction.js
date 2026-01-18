const { default: mongoose } = require("mongoose");
const userModels = require("../../Models/UserSchema");

class WalletService {
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

  // User requests deposit
  async requestDeposit(userId, amount, currency) {
    try {
      // Validate input parameters
      if (!userId) throw new Error("User ID is required");
      if (!amount || typeof amount !== "number" || amount <= 0)
        throw new Error("Valid positive amount is required");
      if (!currency || typeof currency !== "string")
        throw new Error("Currency is required");

      // Convert userId to ObjectId
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Find user - use await
      const user = await userModels.findOne({ _id: userObjectId });
      if (!user) throw new Error("User not found");

      // Check if user already has pending deposit
      const existingPending = await this.TransactionModel.findOne({
        userId: userObjectId,
        type: "deposit",
        status: "pending",
      });

      if (!existingPending) {
        throw new Error("User already has a pending deposit request");
      }

      // Find or create wallet - using transaction for atomicity
      let wallet = await this.WalletModel.findOne({ userId: userObjectId });

      if (!wallet) {
        wallet = await this.WalletModel.create({
          userId: userObjectId,
          balance: 0,
          pending: 0,
          currency: currency.toUpperCase(),
        });
      }

      // Convert amount to smallest unit (kobo/cents)
      const conversionRate = 100; // 1 USD = 100 cents
      const creditedAmountInKobo = Math.round(amount * conversionRate);

      // Update wallet pending amount
      wallet.pending += creditedAmountInKobo;
      await wallet.save();

      // Create main transaction record
      const transaction = await this.TransactionModel.create({
        userId: userObjectId,
        type: "deposit",
        currency: currency.toUpperCase(),
        requestedAmount: creditedAmountInKobo,
        creditedAmount: 0, // Will be updated when confirmed
        status: "pending",
        initiatedAt: new Date(),
        userEmail: user.email,
        userFullName: user.fullName,
      });

      // Create admin transaction record
      await this.AdminTransactionModel.create({
        userId: userObjectId,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        type: "deposit",
        creditedAmount: creditedAmountInKobo,
        currency: currency.toUpperCase(),
        status: "pending",
        transactionId: transaction._id,
      });

      // Optional: Send notification to user
      // await this.sendDepositNotification(user.email, amount, currency);

      return {
        success: true,
        message: "Deposit request submitted successfully",
      };
    } catch (error) {
      console.error("Error in requestDeposit:", error);

      // Return structured error response
      return {
        success: false,
        error: error.message,
        code: error.code || "DEPOSIT_ERROR",
      };
    }
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
      // user,
      // transactionStatus,
    };
  }
  // Admin confirms deposit (partial or full)
  async confirmDeposit(adminId, userId, creditedAmount, transactionId) {
    // const isAdmin = await userModels.findById(adminId);
    // if (!isAdmin) throw new Error("Admin not found");
    // if (isAdmin.role !== "admin") throw new Error("Admin not authorized");
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

    adminTransaction.status = "completed";
    adminTransaction.isConfirmed = "true";
    await adminTransaction.save();

    return wallet;
  }

  async cancleDeposit(adminId, userId, transactionId) {
    // const isAdmin = await userModels.findById(adminId);
    // console.log(isAdmin)
    // if (!isAdmin) throw new Error("Admin not found");

    // if (isAdmin.role !== "admin") throw new Error("Admin not authorized");
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
