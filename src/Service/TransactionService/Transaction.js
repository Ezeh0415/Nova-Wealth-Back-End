const { default: mongoose } = require("mongoose");

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

      // Parse amount to number if it's a string
      let parsedAmount = amount;
      if (typeof amount === "string") {
        parsedAmount = parseFloat(amount);
        // Check if parsing was successful
        if (isNaN(parsedAmount)) {
          throw new Error("Amount must be a valid number");
        }
      }

      if (
        !parsedAmount ||
        typeof parsedAmount !== "number" ||
        parsedAmount <= 0
      )
        throw new Error("Valid positive amount is required");

      if (!currency || typeof currency !== "string")
        throw new Error("Currency is required");

      // Convert userId to ObjectId
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Find user - use await
      const user = await this.userModel.findOne({ _id: userObjectId });
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
      const creditedAmountInKobo = Math.round(parsedAmount * conversionRate); // Use parsedAmount

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

      return {
        success: true,
        message: "Deposit request submitted successfully",
        data: {
          transactionId: transaction._id,
          amount: parsedAmount,
          currency: currency.toUpperCase(),
          status: "pending",
        },
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

  async WithdrawalRequest(userId, amount, currency, walletAddress) {
    // Implementation for withdrawal request
    try {
      if (!userId) throw new Error("User ID is required");

      if (!walletAddress || typeof walletAddress !== "string")
        throw new Error("Wallet address is required");

      let parsedAmount = amount;
      if (typeof amount === "string") {
        parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
          throw new Error("Amount must be a valid number");
        }
      }

      if (
        !parsedAmount ||
        typeof parsedAmount !== "number" ||
        parsedAmount <= 0
      )
        throw new Error("Valid positive amount is required");

      if (!currency || typeof currency !== "string")
        throw new Error("Currency is required");

      // convert userId to ObjectId
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const user = await this.userModel.findOne({ _id: userObjectId });
      if (!user) throw new Error("User not found");

      // Check if user already has pending deposit
      // const existingPending = await this.TransactionModel.findOne({
      //   userId: userObjectId,
      //   type: "withdraw",
      //   status: "pending",
      // });

      // // CORRECT: If we FOUND a pending withdrawal, throw error
      // if (existingPending) {
      //   throw new Error("User already has a pending withdrawal request");
      // }

      const wallet = await this.WalletModel.findOne({ userId: userObjectId });
      if (!wallet) throw new Error("Wallet not found");

      const conversionRate = 100;
      const creditedAmountInKobo = parsedAmount * conversionRate;

      if (wallet.balance < creditedAmountInKobo)
        throw new Error("Insufficient balance");

      wallet.balance -= creditedAmountInKobo;
      wallet.pendingWithdraw += creditedAmountInKobo;
      await wallet.save();

      const transaction = await this.TransactionModel.create({
        userId: userObjectId,
        type: "withdraw",
        currency: currency.toUpperCase(),
        requestedAmount: creditedAmountInKobo,
        creditedAmount: 0,
        status: "pending",
        initiatedAt: new Date(),
        userEmail: user.email,
        userFullName: user.fullName,
      });

      await this.AdminTransactionModel.create({
        userId: userObjectId,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        type: "withdraw",
        creditedAmount: creditedAmountInKobo,
        currency: currency.toUpperCase(),
        status: "pending",
        walletAddress: walletAddress,
        transactionId: transaction._id,
      });

      return {
        success: true,
        message: "withdraw request submitted successfully",
      };
    } catch (error) {
      console.error("Error in WithdrawalRequest:", error);
      return {
        success: false,
        error: error.message,
        code: error.code || "WITHDRAWAL_ERROR",
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
    };
  }

  async confirmDeposit(userId, creditedAmount, transactionId) {
    try {
      // 1. Find the admin transaction - use findOne instead of find
      const adminTransaction = await this.AdminTransactionModel.findOne({
        transactionId: transactionId, // Make sure field name matches your schema
      });

      if (!adminTransaction) {
        throw new Error(
          `Admin transaction not found with transactionId: ${transactionId}`,
        );
      }

      // 2. Check if already confirmed
      if (adminTransaction.isConfirmed === "true") {
        throw new Error("Transaction already confirmed");
      }

      // 3. Find wallet
      const wallet = await this.WalletModel.findOne({ userId });
      if (!wallet) {
        throw new Error(`Wallet not found for userId: ${userId}`);
      }

      // 4. Find the main transaction - check if using correct ID field
      // Is it transactionId or _id? Check your TransactionModel schema
      let transaction;

      // Try finding by _id first (MongoDB ObjectId)
      if (/^[0-9a-fA-F]{24}$/.test(transactionId)) {
        transaction = await this.TransactionModel.findById(transactionId);
      }
      // If not found by _id, try finding by transactionId field
      if (!transaction) {
        transaction = await this.TransactionModel.findOne({
          transactionId: transactionId,
        });
      }

      if (!transaction) {
        throw new Error(
          `Transaction not found with ID: ${transactionId}. Tried both _id and transactionId fields.`,
        );
      }

      // 5. Convert amount
      const creditedAmountInKobo = creditedAmount ;

      // 6. Update wallet
      wallet.pending -= creditedAmountInKobo;
      wallet.totalDeposits += creditedAmountInKobo;
      wallet.balance += creditedAmountInKobo;

      await wallet.save();

      // 7. Update transaction
      transaction.requestedAmount -= creditedAmount;
      transaction.creditedAmount = creditedAmount;
      transaction.status =
        creditedAmount < transaction.requestedAmount ? "pending" : "completed";

      await transaction.save();

      // 8. Update admin transaction
      adminTransaction.status = "completed";
      adminTransaction.isConfirmed = "true";

      await adminTransaction.save();

      return {
        success: true,
        message: "Deposit confirmed successfully",
        wallet,
        transaction,
      };
    } catch (error) {
      console.error("Error in confirmDeposit:", error);
      throw error;
    }
  }

  async confirmWithdrawal(userId, creditedAmount, transactionId) {
    try {
      const adminTransaction = await this.AdminTransactionModel.findOne({
        transactionId: transactionId,
      });

      if (!adminTransaction)
        throw new Error(
          `Admin transaction not found with transactionId: ${transactionId}`,
        );

      if (adminTransaction.isConfirmed === "true")
        throw new Error("Transaction already confirmed");

      const wallet = await this.WalletModel.findOne({ userId });
      if (!wallet) throw new Error("Wallet not found");

      const transaction = await this.TransactionModel.findById(transactionId);
      if (!transaction) throw new Error("Transaction not found");

      const creditedAmountInKobo = creditedAmount;

      if (wallet.balance < creditedAmountInKobo)
        wallet.totalWithdrawals += creditedAmountInKobo;
      wallet.pendingWithdraw -= creditedAmountInKobo;

      await wallet.save();

      transaction.requestedAmount -= creditedAmount;
      transaction.creditedAmount = creditedAmount;
      transaction.status =
        creditedAmount < transaction.requestedAmount ? "pending" : "completed";

      await transaction.save();

      adminTransaction.status = "completed";
      adminTransaction.isConfirmed = "true";

      await adminTransaction.save();

      return {
        success: true,
        message: "withdraw confirmed successfully",
        wallet,
      };
    } catch (error) {
      console.error("Error in confirmWithdrawal:", error);
      throw error;
    }
  }

  async cancleDeposit(userId, transactionId) {
    const adminTransaction = await this.AdminTransactionModel.findOne({
      transactionId: transactionId,
    });
    if (!adminTransaction)
      throw new Error(
        `Admin transaction not found with transactionId: ${transactionId}`,
      );

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

    return {
        success: true,
        message: "deposit cancled",
        wallet,
      };
  }

  async cancleWithdrawal(userId, creditedAmount, transactionId) {
    try {
      const adminTransaction = await this.AdminTransactionModel.findOne({
        transactionId: transactionId,
      });

      if (!adminTransaction)
        throw new Error(
          `Admin transaction not found with transactionId: ${transactionId}`,
        );

      if (adminTransaction.isConfirmed === "true")
        throw new Error("Transaction already confirmed");

      const transaction = await this.TransactionModel.findById(transactionId);
      if (!transaction) throw new Error("Transaction not found");

      const wallet = await this.WalletModel.findOne({ userId });
      if (!wallet) throw new Error("Wallet not found");

      transaction.status = "canceled";
      await transaction.save();

      // 5. Convert amount
      const creditedAmountInKobo = creditedAmount * 100;

      // Reduce pending withdrawal balance
      wallet.pendingWithdraw -= creditedAmountInKobo;
      await wallet.save();

      adminTransaction.isConfirmed = "false";
      await adminTransaction.save();

      return {
        success: true,
        message: "withdrawal cancle successfully",
        wallet,
        transaction,
      };
    } catch (error) {
      console.error("Error in cancleWithdrawal:", error);
      throw error;
    }
  }
}

module.exports = WalletService;
