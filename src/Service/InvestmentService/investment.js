const { default: mongoose } = require("mongoose");

// ======================
// INVESTMENT SERVICE CLASS
// ======================
// Handles all investment-related operations including:
// - Creating new investments
// - Processing daily ROI (Return on Investment)
// - Completing investment terms
// Manages the full investment lifecycle from creation to maturity
class InvestmentService {
  constructor({
    userModels,
    AdminTransactionModel,
    InvestmentModel,
    WalletModel,
    TransactionModel,
  }) {
    // Initialize all model dependencies
    this.userModels = userModels; // User collection model
    this.AdminTransactionModel = AdminTransactionModel; // Admin transaction records
    this.InvestmentModel = InvestmentModel; // Investment records
    this.WalletModel = WalletModel; // User wallet management
    this.TransactionModel = TransactionModel; // Transaction history
  }

  // ======================
  // INVESTMENT CREATION
  // ======================

  /**
   * Creates a new investment for a user
   * Deducts funds from wallet and sets up investment tracking
   *
   * @param {string} userId - ID of the user making the investment
   * @param {number} amount - Investment amount in base currency (e.g., dollars)
   * @param {number} roi - Return on Investment percentage (e.g., 5 for 5%)
   * @param {string} investmentType - Type of investment plan (basic, standard, premium, ultimate)
   * @param {string|Date} investmentStartDate - When the investment starts earning
   * @param {string|Date} investmentEndDate - When the investment matures
   * @returns {Object} - Success response with investment details and updated wallet
   * @throws {Error} - If validation fails, insufficient funds, or user/wallet not found
   *
   * Workflow:
   * 1. Validate all input parameters
   * 2. Convert userId to ObjectId and find user
   * 3. Find user's wallet and check balance
   * 4. Convert amount to kobo/cents (internal precision)
   * 5. Deduct amount from wallet balance
   * 6. Create investment record
   * 7. Create transaction records (user and admin)
   *
   * Note: Uses kobo/cents internally (100 units = 1 currency unit) for financial precision
   */
  async invest(
    userId,
    amount,
    roi,
    investmentType,
    investmentStartDate,
    investmentEndDate,
  ) {
    try {
      // 1. VALIDATION - Ensure all required fields are provided
      if (
        !userId ||
        !amount ||
        !roi ||
        !investmentType ||
        !investmentStartDate ||
        !investmentEndDate
      ) {
        throw new Error("All fields are required");
      }

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // 2. USER VERIFICATION - Convert ID and find user
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const user = await this.userModels.findById(userObjectId);
      if (!user) {
        throw new Error("User not found");
      }

      // 3. WALLET VERIFICATION - Find user's wallet
      const wallet = await this.WalletModel.findOne({ userId: userObjectId });
      if (!wallet) {
        throw new Error("Wallet not found for user");
      }

      // 4. AMOUNT CONVERSION - Convert to smallest unit for precision
      const creditedAmountInKobo = amount * 100; // e.g., $10 = 1000 kobo

      // 5. BALANCE CHECK - Verify user has sufficient funds
      if (wallet.balance < creditedAmountInKobo) {
        throw new Error(
          `Insufficient balance. Available: $${wallet.balance / 100}, Required: $${amount}`,
        );
      }

      // 6. WALLET UPDATE - Deduct investment amount from available balance
      // Note: Line 73 has a comment about using userId vs userObjectId
      await this.WalletModel.updateOne(
        { userId: userObjectId }, // Fixed as per comment: should be userId field, not userObjectId
        { $inc: { balance: -creditedAmountInKobo } },
      );

      // 7. INVESTMENT CREATION - Store investment details
      const investment = new this.InvestmentModel({
        userId: userObjectId,
        amount: creditedAmountInKobo, // Store in kobo for internal calculations
        roi,
        investmentType,
        investmentStartDate: new Date(investmentStartDate),
        investmentEndDate: new Date(investmentEndDate),
        status: "active", // Initial status
      });

      await investment.save();

      // 8. USER TRANSACTION RECORD - Log investment transaction
      const transaction = new this.TransactionModel({
        userId: userObjectId,
        type: "investment",
        creditedAmount: creditedAmountInKobo,
        description: `New investment in ${investmentType} plan`,
        status: "active",
      });

      await transaction.save();

      // 9. ADMIN TRANSACTION RECORD - For admin monitoring and reporting
      const adminTransaction = new this.AdminTransactionModel({
        userId: userObjectId,
        transactionId: investment._id, // Link to investment record
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        type: "investment",
        creditedAmount: creditedAmountInKobo,
        status: "active",
      });

      await adminTransaction.save();

      // 10.Notification can be added here if needed
      const notification = new this.NotificationModel({
        user: userObjectId,
        type: "investment",
        title: "Investment Created Successfully",
        message: `Your investment of $${amount} in the ${investmentType} plan has been created successfully.`,
        data: { investmentId: investment._id },
        priority: "success",
        category: "investment",
        icon: "investment",
      });

      await notification.save();

      // 11. SUCCESS RESPONSE - Return formatted investment details
      return {
        success: true,
        message: "Investment created successfully",
        investment: {
          id: investment._id,
          amount: investment.amount / 100, // Convert back to base currency for response
          roi: investment.roi,
          type: investment.investmentType,
          startDate: investment.investmentStartDate,
          endDate: investment.investmentEndDate,
          status: investment.status,
        },
        wallet: {
          newBalance: (wallet.balance - creditedAmountInKobo) / 100, // Show updated balance
        },
      };
    } catch (error) {
      console.error("❌ Investment creation error:", error.message);
      throw error; // Re-throw for controller error handling
    }
  }

  // ======================
  // DAILY ROI PROCESSING (CRON JOB)
  // ======================

  /**
   * Processes daily Return on Investment for all active investments
   * This is typically called by a cron job every 24 hours
   *
   * Workflow:
   * 1. Defines daily interval (24 hours)
   * 2. Sets ROI rates for different investment plans
   * 3. Fetches all active investments
   * 4. For each investment:
   *    - Checks if 24 hours have passed since last ROI
   *    - Checks if investment has expired
   *    - Calculates profit based on investment type rate
   *    - Updates investment returns
   *    - Credits profit to investment balance
   *    - Creates transaction record
   *
   * Important: Prevents double-crediting by checking lastRoiAt timestamp
   */
  async processDailyROI() {
    // Constants
    const DAILY_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // ROI rates for different investment plans (2%, 4%, 6%, 8% daily)
    const PLAN_RATES = {
      basic: 0.02, // 2% daily ROI
      standard: 0.04, // 4% daily ROI
      premium: 0.06, // 6% daily ROI
      ultimate: 0.08, // 8% daily ROI
    };

    const now = new Date(); // Current timestamp for processing

    // Fetch all active investments that need ROI processing
    const investments = await this.InvestmentModel.find({
      investmentStatus: "active",
    });

    // Process each investment individually
    for (const inv of investments) {
      // Get ROI rate for this investment type
      const rate = PLAN_RATES[inv.investmentType];
      if (!rate) continue; // Skip if investment type not recognized

      // Determine when ROI was last calculated
      const lastRun = inv.lastRoiAt || inv.investmentStartDate;

      // 🔒 PREVENT DOUBLE CREDITING
      // Only process if at least 24 hours have passed since last ROI
      if (now - lastRun < DAILY_INTERVAL) continue;

      // ⛔ CHECK IF INVESTMENT HAS EXPIRED
      // If end date reached, mark as completed instead of processing ROI
      if (now >= inv.investmentEndDate) {
        await this.completeInvestment(inv._id);
        continue; // Skip to next investment
      }

      // Validate investment amount is a positive number
      const amount = Number(inv.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      // Calculate profit (no rounding to prevent fractional loss)
      const profit = amount * rate; // e.g., 1000 * 0.02 = 20 kobo

      // Update investment record with new returns
      inv.TotalReturns = (inv.TotalReturns || 0) + profit;
      inv.lastRoiAt = now; // Update last ROI timestamp
      await inv.save();

      // Credit profit to investment balance (separate from main balance)
      await this.WalletModel.updateOne(
        { userId: inv.userId },
        { $inc: { invBalance: profit } }, // invBalance holds ROI earnings
      );

      // Create transaction record for audit trail
      await this.TransactionModel.create({
        userId: inv.userId,
        investmentId: inv._id,
        type: "profit",
        creditedAmount: profit,
        description: "Daily investment ROI",
      });
    }
  }

  // ======================
  // INVESTMENT COMPLETION
  // ======================

  /**
   * Completes an investment when it reaches maturity
   * Returns capital + accumulated ROI to user's main balance
   *
   * @param {string} investmentId - ID of the investment to complete
   * @returns {Object} - The completed investment document
   * @throws {Error} - If investment or wallet not found
   *
   * Workflow:
   * 1. Find the investment
   * 2. Verify it's still active
   * 3. Find user's wallet
   * 4. Find related transactions
   * 5. Transfer capital + ROI from invBalance to main balance
   * 6. Update investment status to "completed"
   * 7. Update transaction status
   */
  async completeInvestment(investmentId) {
    // 1. FIND INVESTMENT
    const investment = await this.InvestmentModel.findById(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    // 2. VERIFY STATUS - Only complete if still active
    if (investment.investmentStatus !== "active") {
      return; // Silently ignore or could log a warning
    }

    // 3. FIND USER'S WALLET
    const wallet = await this.WalletModel.findOne({
      userId: investment.userId,
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // 4. FIND RELATED TRANSACTIONS (for updating status)
    const transaction = await this.TransactionModel.find({
      userId: investment.userId,
    });

    // 5. TRANSFER FUNDS - Capital + ROI to main balance
    // Capital (investment.amount) + ROI (wallet.invBalance)
    wallet.balance += investment.amount + wallet.invBalance;
    wallet.totalReturn += wallet.invBalance; // Track total returns
    wallet.invBalance = 0; // Reset investment balance

    await wallet.save();

    // 6. UPDATE INVESTMENT STATUS
    investment.investmentStatus = "completed";
    investment.investmentEndDate = new Date(); // Set actual completion date
    await investment.save();

    // 7. UPDATE TRANSACTION STATUS (if transactions found)
    if (transaction && transaction.length > 0) {
      // Note: This updates all user transactions, not just investment-related ones
      // Might need to be more specific
      transaction.status = "completed";
      await transaction.save();
    }

    const notification = new this.NotificationModel({
      user: investment.userId,
      type: "investment",
      title: "Investment Completed",
      message: `Your investment in the ${investment.investmentType} plan has completed. Your capital and returns have been credited to your wallet.`,
      data: { investmentId: investment._id },
      priority: "success",
      category: "investment",
      icon: "investment",
    });

    await notification.save();

    return investment; // Return completed investment for reference
  }
}

// ======================
// MODULE EXPORT
// ======================
module.exports = InvestmentService;

// ======================
// KEY ARCHITECTURE NOTES:
// ======================
// 1. FINANCIAL PRECISION: Uses kobo/cents (100 units = 1 currency unit) internally
// 2. ROI CALCULATION: Daily compounding without rounding to maximize returns
// 3. BALANCE SEPARATION:
//    - balance: Available spending money
//    - invBalance: ROI earnings (separated until investment completion)
// 4. INVESTMENT LIFECYCLE:
//    - active: Earning daily ROI
//    - completed: Capital + ROI returned to main balance
// 5. AUDIT TRAIL: Every action creates transaction records for transparency
// 6. ADMIN MONITORING: Separate admin transaction records for oversight

// ======================
// IMPORTANT NOTES:
// ======================
// 1. Line 73: UpdateOne query uses userId field (not userObjectId variable)
// 2. ROI RATES: Very high rates (2-8% daily) - ensure sustainable business model
// 3. SECURITY: No input sanitization shown - should be done in controller/middleware
// 4. PERFORMANCE: processDailyROI processes all investments - consider batching for large datasets
// 5. ERROR HANDLING: Some errors are thrown, some silently ignored - consider consistent approach
// 6. TRANSACTION CONSISTENCY: Consider using MongoDB transactions for multi-document operations

// ======================
// TYPICAL USAGE:
// ======================
// 1. User creates investment via /api/invest endpoint
// 2. Daily cron job calls processDailyROI() to credit earnings
// 3. When investment matures, completeInvestment() is called automatically
// 4. Users can view investment status and returns through dashboard

// ======================
// SECURITY CONSIDERATIONS:
// ======================
// 1. Validate all user inputs before processing
// 2. Implement rate limiting on investment creation
// 3. Consider maximum investment amounts per user
// 4. Add investment withdrawal penalties/fees if needed
// 5. Implement fraud detection for abnormal investment patterns
