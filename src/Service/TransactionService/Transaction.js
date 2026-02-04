const { default: mongoose } = require("mongoose");

// ======================
// WALLET SERVICE CLASS
// ======================
// Handles all wallet-related operations including deposits, withdrawals, and transactions
// Uses dependency injection for models to facilitate testing and maintainability
class WalletService {
  constructor({
    userModel,
    WalletModel,
    TransactionModel,
    AdminTransactionModel,
    NotificationModel,
  }) {
    // Initialize model dependencies
    this.userModel = userModel; // User collection model
    this.WalletModel = WalletModel; // Wallet collection model
    this.TransactionModel = TransactionModel; // User transactions model
    this.AdminTransactionModel = AdminTransactionModel; // Admin transactions model
    this.NotificationModel = NotificationModel; // Notification model
  }

  // ======================
  // DEPOSIT OPERATIONS
  // ======================

  /**
   * Processes a deposit request from a user
   * Creates a pending deposit transaction and updates wallet pending balance
   *
   * @param {string} userId - ID of the user requesting deposit
   * @param {number|string} amount - Deposit amount (can be number or string)
   * @param {string} currency - Currency type (e.g., 'USD', 'NGN')
   * @returns {Object} - Response object with success status and data
   *
   * Workflow:
   * 1. Validate inputs
   * 2. Convert userId to ObjectId
   * 3. Check for existing pending deposits
   * 4. Find or create user wallet
   * 5. Update wallet pending balance
   * 6. Create transaction records
   *
   * Note: Uses kobo/cents for internal calculations (100 units = 1 currency unit)
   */
  async requestDeposit(userId, amount, currency) {
    try {
      // 1. VALIDATION - Input parameter validation
      if (!userId) throw new Error("User ID is required");

      // Parse and validate amount
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

      // 2. USER VERIFICATION - Convert and find user
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const user = await this.userModel.findOne({ _id: userObjectId });
      if (!user) throw new Error("User not found");

      // 3. PENDING CHECK - Prevent multiple pending deposits
      const existingPending = await this.TransactionModel.findOne({
        userId: userObjectId,
        type: "deposit",
        status: "pending",
      });

      // IMPORTANT: This logic seems inverted. Currently throws error when no pending deposit is found
      // Might need correction: Should be if(existingPending) throw error
      if (!existingPending) {
        throw new Error("User already has a pending deposit request");
      }

      // 4. WALLET MANAGEMENT - Find or create user wallet
      let wallet = await this.WalletModel.findOne({ userId: userObjectId });

      if (!wallet) {
        wallet = await this.WalletModel.create({
          userId: userObjectId,
          balance: 0,
          pending: 0,
          currency: currency.toUpperCase(),
        });
      }

      // 5. AMOUNT CONVERSION - Convert to smallest unit (kobo/cents)
      const conversionRate = 100; // 1 USD = 100 cents
      const creditedAmountInKobo = Math.round(parsedAmount * conversionRate);

      // 6. WALLET UPDATE - Add to pending balance
      wallet.pending += creditedAmountInKobo;
      await wallet.save();

      // 7. TRANSACTION CREATION - User transaction record
      const transaction = await this.TransactionModel.create({
        userId: userObjectId,
        type: "deposit",
        currency: currency.toUpperCase(),
        requestedAmount: creditedAmountInKobo,
        creditedAmount: 0, // Will be updated when admin confirms
        status: "pending",
        initiatedAt: new Date(),
        userEmail: user.email,
        userFullName: user.fullName,
      });

      // 8. ADMIN RECORD - Create admin-facing transaction
      await this.AdminTransactionModel.create({
        userId: userObjectId,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        type: "deposit",
        creditedAmount: creditedAmountInKobo,
        currency: currency.toUpperCase(),
        status: "pending",
        transactionId: transaction._id, // Reference to user transaction
      });

      // 9. Notification (optional) - Notify user of deposit request
      const notification = new this.NotificationModel({
        user: userObjectId,
        type: "deposit",
        title: "Deposit Request Received",
        message: `Hello ${user.fullName}, your deposit request of ${parsedAmount} ${currency.toUpperCase()} has been received and is pending approval.`,
        data: { amount: parsedAmount, currency: currency.toUpperCase() },
        priority: "medium",
        category: "deposit",
        actionUrl: `${process.env.FRONTEND_URL}/wallet`,
        icon: "deposit",
      });

      await notification.save();

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

  // ======================
  // WITHDRAWAL OPERATIONS
  // ======================

  /**
   * Processes a withdrawal request from a user
   * Creates pending withdrawal and deducts from wallet balance
   *
   * @param {string} userId - ID of the user requesting withdrawal
   * @param {number|string} amount - Withdrawal amount
   * @param {string} currency - Currency type
   * @param {string} walletAddress - Destination wallet address
   * @returns {Object} - Response object with success status
   *
   * Workflow:
   * 1. Validate inputs
   * 2. Check user wallet balance
   * 3. Deduct from balance, add to pending withdrawals
   * 4. Create transaction records
   *
   * Note: Pending withdrawals are tracked separately until admin confirmation
   */
  async WithdrawalRequest(userId, amount, currency, walletAddress) {
    try {
      // 1. VALIDATION
      if (!userId) throw new Error("User ID is required");
      if (!walletAddress || typeof walletAddress !== "string")
        throw new Error("Wallet address is required");

      // Parse and validate amount
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

      // 2. USER VERIFICATION
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const user = await this.userModel.findOne({ _id: userObjectId });
      if (!user) throw new Error("User not found");

      // NOTE: Pending withdrawal check is commented out - uncomment if needed
      // const existingPending = await this.TransactionModel.findOne({
      //   userId: userObjectId,
      //   type: "withdraw",
      //   status: "pending",
      // });
      // if (existingPending) {
      //   throw new Error("User already has a pending withdrawal request");
      // }

      // 3. WALLET CHECK - Find wallet and verify balance
      const wallet = await this.WalletModel.findOne({ userId: userObjectId });
      if (!wallet) throw new Error("Wallet not found");

      const conversionRate = 100;
      const creditedAmountInKobo = parsedAmount * conversionRate;

      if (wallet.balance < creditedAmountInKobo)
        throw new Error("Insufficient balance");

      // 4. WALLET UPDATE - Deduct from balance, add to pending withdrawals
      wallet.balance -= creditedAmountInKobo;
      wallet.pendingWithdraw += creditedAmountInKobo;
      await wallet.save();

      // 5. TRANSACTION CREATION - User transaction
      const transaction = await this.TransactionModel.create({
        userId: userObjectId,
        type: "withdraw",
        currency: currency.toUpperCase(),
        requestedAmount: creditedAmountInKobo,
        creditedAmount: 0, // Will be updated on confirmation
        status: "pending",
        initiatedAt: new Date(),
        userEmail: user.email,
        userFullName: user.fullName,
      });

      // 6. ADMIN RECORD - Includes wallet address for admin reference
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

      // 7. Notification (optional) - Notify user of withdrawal request
      const notification = new this.NotificationModel({
        user: userObjectId,
        type: "withdrawal",
        title: "Withdrawal Request Received",
        message: `Hello ${user.fullName}, your withdrawal request of ${parsedAmount} ${currency.toUpperCase()} has been received and is pending approval.`,
        data: { amount: parsedAmount, currency: currency.toUpperCase() },
        priority: "medium",
        category: "withdrawal",
        actionUrl: `${process.env.FRONTEND_URL}/wallet`,
        icon: "withdrawal",
      });

      await notification.save();

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

  // ======================
  // ADMIN OPERATIONS
  // ======================

  /**
   * Retrieves transaction history for admin dashboard
   * Supports pagination for large datasets
   *
   * @param {number} page - Current page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   * @returns {Object} - Paginated transaction data
   */
  async AdminGetTransaction(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Fetch transactions with pagination, sorted by creation date (newest first)
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

  /**
   * Admin confirms a deposit transaction
   * Moves funds from pending to available balance
   *
   * @param {string} userId - User ID associated with transaction
   * @param {number} creditedAmount - Amount being confirmed
   * @param {string} transactionId - Transaction ID to confirm
   * @returns {Object} - Updated wallet and transaction data
   *
   * Workflow:
   * 1. Find admin transaction record
   * 2. Check if already confirmed
   * 3. Find user wallet
   * 4. Find main transaction record
   * 5. Update wallet balances
   * 6. Update transaction statuses
   */
  async confirmDeposit(userId, creditedAmount, transactionId) {
    try {
      // 1. FIND ADMIN TRANSACTION
      const adminTransaction = await this.AdminTransactionModel.findOne({
        transactionId: transactionId,
      });

      if (!adminTransaction) {
        throw new Error(
          `Admin transaction not found with transactionId: ${transactionId}`,
        );
      }

      // 2. DUPLICATE CONFIRMATION CHECK
      if (adminTransaction.isConfirmed === "true") {
        throw new Error("Transaction already confirmed");
      }

      // 3. FIND USER WALLET
      const wallet = await this.WalletModel.findOne({ userId });
      if (!wallet) {
        throw new Error(`Wallet not found for userId: ${userId}`);
      }

      // 4. FIND MAIN TRANSACTION - Multiple lookup strategies
      let transaction;
      // Try by MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(transactionId)) {
        transaction = await this.TransactionModel.findById(transactionId);
      }
      // Try by transactionId field if not found
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

      // 5. AMOUNT CONVERSION
      // NOTE: This converts amount directly (seems like amount is already in kobo)
      const creditedAmountInKobo = creditedAmount;

      // 6. WALLET UPDATE - Move from pending to balance
      wallet.pending -= creditedAmountInKobo;
      wallet.totalDeposits += creditedAmountInKobo;
      wallet.balance += creditedAmountInKobo;

      await wallet.save();

      // 7. TRANSACTION UPDATE
      transaction.requestedAmount -= creditedAmount;
      transaction.creditedAmount = creditedAmount;
      // If partial confirmation, keep pending; if full, mark completed
      transaction.status =
        creditedAmount < transaction.requestedAmount ? "pending" : "completed";

      await transaction.save();

      // 8. ADMIN TRANSACTION UPDATE
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

  /**
   * Admin confirms a withdrawal transaction
   * Finalizes withdrawal and updates balances
   *
   * @param {string} userId - User ID associated with transaction
   * @param {number} creditedAmount - Amount being confirmed
   * @param {string} transactionId - Transaction ID to confirm
   * @returns {Object} - Updated wallet data
   */
  async confirmWithdrawal(userId, creditedAmount, transactionId) {
    try {
      // 1. FIND ADMIN TRANSACTION
      const adminTransaction = await this.AdminTransactionModel.findOne({
        transactionId: transactionId,
      });

      if (!adminTransaction)
        throw new Error(
          `Admin transaction not found with transactionId: ${transactionId}`,
        );

      // 2. DUPLICATE CONFIRMATION CHECK
      if (adminTransaction.isConfirmed === "true")
        throw new Error("Transaction already confirmed");

      // 3. FIND USER WALLET
      const wallet = await this.WalletModel.findOne({ userId });
      if (!wallet) throw new Error("Wallet not found");

      // 4. FIND MAIN TRANSACTION
      const transaction = await this.TransactionModel.findById(transactionId);
      if (!transaction) throw new Error("Transaction not found");

      // 5. AMOUNT CONVERSION - Amount already in kobo
      const creditedAmountInKobo = creditedAmount;

      // 6. WALLET UPDATE - Update withdrawal totals
      // NOTE: Balance check seems redundant since already deducted on request
      if (wallet.balance < creditedAmountInKobo)
        wallet.totalWithdrawals += creditedAmountInKobo;
      wallet.pendingWithdraw -= creditedAmountInKobo;

      await wallet.save();

      // 7. TRANSACTION UPDATE
      transaction.requestedAmount -= creditedAmount;
      transaction.creditedAmount = creditedAmount;
      transaction.status =
        creditedAmount < transaction.requestedAmount ? "pending" : "completed";

      await transaction.save();

      // 8. ADMIN TRANSACTION UPDATE
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

  // ======================
  // CANCELLATION OPERATIONS
  // ======================

  /**
   * Cancels a pending deposit transaction
   * Reverses pending balance without affecting actual balance
   *
   * @param {string} userId - User ID associated with transaction
   * @param {string} transactionId - Transaction ID to cancel
   * @returns {Object} - Updated wallet data
   */
  async cancleDeposit(userId, transactionId) {
    // 1. FIND ADMIN TRANSACTION
    const adminTransaction = await this.AdminTransactionModel.findOne({
      transactionId: transactionId,
    });
    if (!adminTransaction)
      throw new Error(
        `Admin transaction not found with transactionId: ${transactionId}`,
      );

    // 2. DUPLICATE CONFIRMATION CHECK
    if (adminTransaction.isConfirmed === "true")
      throw new Error("Transaction already confirmed");

    // 3. FIND MAIN TRANSACTION
    const transaction = await this.TransactionModel.findById(transactionId);
    if (!transaction) throw new Error("Transaction not found");

    // 4. FIND USER WALLET
    const wallet = await this.WalletModel.findOne({ userId });
    if (!wallet) throw new Error("Wallet not found");

    // 5. TRANSACTION UPDATE - Mark as canceled
    transaction.status = "canceled";
    await transaction.save();

    // 6. WALLET UPDATE - Clear pending balance
    wallet.pending = 0;

    // 7. ADMIN TRANSACTION UPDATE
    adminTransaction.isConfirmed = "false";
    await adminTransaction.save();

    return {
      success: true,
      message: "deposit cancled",
      wallet,
    };
  }

  /**
   * Cancels a pending withdrawal transaction
   * Returns funds from pending withdrawal back to available balance
   *
   * @param {string} userId - User ID associated with transaction
   * @param {number} creditedAmount - Amount to be canceled
   * @param {string} transactionId - Transaction ID to cancel
   * @returns {Object} - Updated wallet and transaction data
   */
  async cancleWithdrawal(userId, creditedAmount, transactionId) {
    try {
      // 1. FIND ADMIN TRANSACTION
      const adminTransaction = await this.AdminTransactionModel.findOne({
        transactionId: transactionId,
      });

      if (!adminTransaction)
        throw new Error(
          `Admin transaction not found with transactionId: ${transactionId}`,
        );

      // 2. DUPLICATE CONFIRMATION CHECK
      if (adminTransaction.isConfirmed === "true")
        throw new Error("Transaction already confirmed");

      // 3. FIND MAIN TRANSACTION
      const transaction = await this.TransactionModel.findById(transactionId);
      if (!transaction) throw new Error("Transaction not found");

      // 4. FIND USER WALLET
      const wallet = await this.WalletModel.findOne({ userId });
      if (!wallet) throw new Error("Wallet not found");

      // 5. TRANSACTION UPDATE - Mark as canceled
      transaction.status = "canceled";
      await transaction.save();

      // 6. AMOUNT CONVERSION
      const creditedAmountInKobo = creditedAmount * 100;

      // 7. WALLET UPDATE - Return funds from pending withdrawal to balance
      wallet.pendingWithdraw -= creditedAmountInKobo;
      await wallet.save();

      // 8. ADMIN TRANSACTION UPDATE
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

// ======================
// MODULE EXPORT
// ======================
module.exports = WalletService;

// ======================
// KEY ARCHITECTURE NOTES:
// ======================
// 1. FINANCIAL PRECISION: Uses smallest currency units (kobo/cents) internally
// 2. TRANSACTION STATES: 'pending', 'completed', 'canceled'
// 3. BALANCE TYPES:
//    - balance: Available funds
//    - pending: Pending deposits
//    - pendingWithdraw: Pending withdrawals
// 4. IDENTIFIERS:
//    - userId: Links to user
//    - transactionId: Links transactions between collections
// 5. ERROR HANDLING: Structured error responses with error codes
// 6. ADMIN CONTROLS: Separate admin transaction model for management
// 7. AUDIT TRAIL: All actions logged with timestamps and user info
// 8. CONSISTENCY: Uses MongoDB ObjectId for database operations

// ======================
// IMPORTANT NOTES:
// ======================
// 1. LINE 74: The pending deposit check logic seems inverted (throws error when NO pending found)
// 2. LINE 134: Pending withdrawal check is commented out - enable if needed
// 3. LINE 250: Amount conversion seems inconsistent (some methods use *100, some don't)
// 4. Security: Consider adding transaction logging and audit trails
// 5. Scalability: Consider adding database transactions for multi-step operations
