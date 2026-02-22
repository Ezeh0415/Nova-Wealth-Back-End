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
    NotificationModel,
    InvestmentPlanModel, // ADDED: Investment Plan Model
  }) {
    // Initialize all model dependencies
    this.userModels = userModels; // User collection model
    this.AdminTransactionModel = AdminTransactionModel; // Admin transaction records
    this.InvestmentModel = InvestmentModel; // Investment records
    this.WalletModel = WalletModel; // User wallet management
    this.TransactionModel = TransactionModel; // Transaction history
    this.NotificationModel = NotificationModel; // Notification system
    this.InvestmentPlanModel = InvestmentPlanModel; // ADDED: Investment plans
  }

  // ======================
  // HELPER METHODS
  // ======================

  /**
   * Get ROI percentage for investment type from database
   * @param {string} investmentType - Investment plan type
   * @returns {number} - ROI percentage
   */
  async getROIForInvestmentType(investmentType) {
    try {
      const plan = await this.InvestmentPlanModel.findOne({
        planId: investmentType,
        isActive: true,
      });

      if (!plan) {
        throw new Error(
          `Investment plan "${investmentType}" not found or inactive`,
        );
      }

      return plan.roi;
    } catch (error) {
      console.error("Error getting ROI:", error.message);
      throw error;
    }
  }

  /**
   * Get duration for investment type from database
   * @param {string} investmentType - Investment plan type
   * @returns {number} - Duration in days
   */
  async getDurationForInvestmentType(investmentType) {
    try {
      const plan = await this.InvestmentPlanModel.findOne({
        planId: investmentType,
        isActive: true,
      });

      if (!plan) {
        throw new Error(
          `Investment plan "${investmentType}" not found or inactive`,
        );
      }

      return plan.duration;
    } catch (error) {
      console.error("Error getting duration:", error.message);
      throw error;
    }
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
   * @param {string} investmentType - Type of investment plan (basic, standard, premium, ultimate)
   * @returns {Object} - Success response with investment details
   * @throws {Error} - If validation fails, insufficient funds, or user/wallet not found
   */
  async invest(userId, amount, investmentType) {
    try {
      // 1. VALIDATION
      if (!userId || !amount || !investmentType) {
        throw new Error("All fields are required");
      }

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // 2. CHECK INVESTMENT PLAN EXISTS AND IS ACTIVE
      const plan = await this.InvestmentPlanModel.findOne({
        planId: investmentType,
        isActive: true,
      });

      if (!plan) {
        throw new Error(
          `Investment plan "${investmentType}" not found or inactive`,
        );
      }

      // 3. CHECK AMOUNT WITHIN PLAN LIMITS
      if (amount < plan.minAmount) {
        throw new Error(
          `Minimum investment for ${plan.name} is $${plan.minAmount}`,
        );
      }

      if (amount > plan.maxAmount) {
        throw new Error(
          `Maximum investment for ${plan.name} is $${plan.maxAmount}`,
        );
      }

      // 4. USER VERIFICATION
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const user = await this.userModels.findById(userObjectId);
      if (!user) {
        throw new Error("User not found");
      }

      // 5. WALLET VERIFICATION
      const wallet = await this.WalletModel.findOne({ userId: userObjectId });
      if (!wallet) {
        throw new Error("Wallet not found for user");
      }

      // 6. AMOUNT CONVERSION
      const creditedAmountInKobo = amount * 100;

      // 7. BALANCE CHECK
      if (wallet.balance < creditedAmountInKobo) {
        throw new Error(
          `Insufficient balance. Available: $${wallet.balance / 100}, Required: $${amount}`,
        );
      }

      // 8. GET ROI FROM PLAN (not from parameter)
      const roi = plan.roi;

      // 9. DEDUCT FROM BALANCE
      wallet.balance -= creditedAmountInKobo;
      wallet.pendingInvestment =
        (wallet.pendingInvestment || 0) + creditedAmountInKobo;
      await wallet.save();

      // 10. CREATE INVESTMENT (WITHOUT FINAL DATES - will be set on confirmation)
      const investment = new this.InvestmentModel({
        userId: userObjectId,
        amount: creditedAmountInKobo,
        roi: roi,
        investmentType: investmentType,
        investmentPlanName: plan.name, // Store plan name for reference
        investmentStatus: "pending",
        planId: plan.planId, // Reference to plan
      });

      await investment.save();

      // 11. CREATE TRANSACTIONS
      const transaction = new this.TransactionModel({
        userId: userObjectId,
        type: "investment",
        creditedAmount: creditedAmountInKobo,
        description: `Investment request - ${plan.name} (${investmentType})`,
        status: "pending",
        transactionId: investment._id,
      });

      await transaction.save();

      const adminTransaction = new this.AdminTransactionModel({
        userId: userObjectId,
        transactionId: investment._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        type: "investment",
        creditedAmount: creditedAmountInKobo,
        status: "pending",
        investmentType: investmentType,
        investmentPlanName: plan.name,
      });

      await adminTransaction.save();

      // 12. SEND NOTIFICATION
      await this.NotificationModel.create({
        user: userObjectId,
        type: "investment",
        title: "Investment Request Created",
        message: `Your ${plan.name} investment request of $${amount} has been created and is pending approval.`,
        data: {
          investmentId: investment._id,
          amount: amount,
          planName: plan.name,
          roi: roi,
        },
        category: "investment",
        icon: "investment",
      });

      return {
        success: true,
        message:
          "Investment request created successfully. Awaiting confirmation.",
        investment: {
          id: investment._id,
          amount: amount,
          investmentType: investmentType,
          planName: plan.name,
          roi: roi,
          status: "pending",
        },
        wallet: {
          balance: wallet.balance / 100,
          pendingInvestment: wallet.pendingInvestment / 100,
        },
      };
    } catch (error) {
      console.error("❌ Investment creation error:", error.message);
      throw error;
    }
  }

  // ======================
  // INVESTMENT CONFIRMATION
  // ======================

  /**
   * Confirms and activates a pending investment
   * Sets actual start and end dates based on plan duration
   *
   * @param {string} investmentId - ID of investment to confirm
   * @returns {Object} - Success response with activated investment details
   */
  async confirmInvestment(investmentId) {
    try {
      // 1. FIND INVESTMENT
      const investment = await this.InvestmentModel.findById(investmentId);
      if (!investment) {
        throw new Error("Investment not found");
      }

      // 2. CHECK STATUS
      if (investment.investmentStatus !== "pending") {
        throw new Error(`Investment is already ${investment.investmentStatus}`);
      }

      // 3. FIND USER'S WALLET
      const wallet = await this.WalletModel.findOne({
        userId: investment.userId,
      });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // 4. FIND INVESTMENT PLAN FOR DURATION
      const plan = await this.InvestmentPlanModel.findOne({
        planId: investment.investmentType,
      });

      if (!plan) {
        throw new Error(
          `Investment plan "${investment.investmentType}" not found`,
        );
      }

      // 5. MOVE FUNDS FROM PENDING TO INVESTMENT BALANCE
      if (wallet.pendingInvestment < investment.amount) {
        throw new Error("Insufficient pending investment balance");
      }

      wallet.pendingInvestment -= investment.amount;
      wallet.invBalance = (wallet.invBalance || 0) + investment.amount;
      await wallet.save();

      console.log(
        `✅ Moved ${investment.amount / 100} from pending to investment balance`,
      );

      // 6. SET ACTUAL DATES BASED ON PLAN DURATION
      const actualStartDate = new Date();
      const actualEndDate = new Date(actualStartDate);
      actualEndDate.setDate(actualEndDate.getDate() + plan.duration);

      // 7. UPDATE INVESTMENT
      investment.investmentStartDate = actualStartDate;
      investment.investmentEndDate = actualEndDate;
      investment.investmentStatus = "active";
      investment.lastRoiAt = actualStartDate; // Initialize ROI tracking
      await investment.save();

      // 8. UPDATE ADMIN TRANSACTION
      await this.AdminTransactionModel.updateOne(
        { transactionId: investment._id },
        { status: "active" },
      );

      // 9. UPDATE USER TRANSACTION
      await this.TransactionModel.updateOne(
        { transactionId: investment._id},
        { status: "active" },
      );

      // 10. SEND NOTIFICATION
      await this.NotificationModel.create({
        user: investment.userId,
        type: "investment",
        title: "Investment Activated! 🎉",
        message: `Your ${plan.name} investment of $${(investment.amount / 100).toFixed(2)} is now active. It will mature on ${actualEndDate.toLocaleDateString()}.`,
        data: {
          investmentId: investment._id,
          startDate: actualStartDate,
          endDate: actualEndDate,
          planName: plan.name,
          roi: plan.roi,
        },
        category: "investment",
        icon: "investment",
      });

      return {
        success: true,
        message: "Investment confirmed and activated successfully",
        investment: {
          id: investment._id,
          amount: investment.amount / 100,
          investmentType: investment.investmentType,
          planName: plan.name,
          roi: investment.roi,
          startDate: actualStartDate,
          endDate: actualEndDate,
          duration: plan.duration,
          status: "active",
        },
        wallet: {
          pendingInvestment: wallet.pendingInvestment / 100,
          invBalance: wallet.invBalance / 100,
          balance: wallet.balance / 100,
        },
      };
    } catch (error) {
      console.error("❌ Investment confirmation error:", error.message);
      throw error;
    }
  }

  // async confirmInvestment(investmentId) {
  //   try {
  //     // 1. FIND INVESTMENT
  //     const investment = await this.InvestmentModel.findById(investmentId);
  //     if (!investment) {
  //       throw new Error("Investment not found");
  //     }

  //     // 2. CHECK STATUS
  //     if (investment.investmentStatus !== "pending") {
  //       throw new Error(`Investment is already ${investment.investmentStatus}`);
  //     }

  //     // 3. FIND USER'S WALLET
  //     const wallet = await this.WalletModel.findOne({ userId: investment.userId });
  //     if (!wallet) {
  //       throw new Error("Wallet not found");
  //     }

  //     // 4. FIND INVESTMENT PLAN FOR DURATION
  //     const plan = await this.InvestmentPlanModel.findOne({
  //       planId: investment.investmentType,
  //     });

  //     if (!plan) {
  //       throw new Error(`Investment plan "${investment.investmentType}" not found`);
  //     }

  //     // 5. MOVE FUNDS FROM PENDING TO INVESTMENT BALANCE
  //     if (wallet.pendingInvestment < investment.amount) {
  //       throw new Error("Insufficient pending investment balance");
  //     }

  //     wallet.pendingInvestment -= investment.amount;
  //     wallet.invBalance = (wallet.invBalance || 0) + investment.amount;
  //     await wallet.save();

  //     console.log(
  //       `✅ Moved ${investment.amount / 100} from pending to investment balance`,
  //     );

  //     // 6. SET ACTUAL DATES BASED ON PLAN DURATION
  //     const actualStartDate = new Date();
  //     const actualEndDate = new Date(actualStartDate);
  //     actualEndDate.setDate(actualEndDate.getDate() + plan.duration);

  //     // 7. UPDATE INVESTMENT
  //     investment.investmentStartDate = actualStartDate;
  //     investment.investmentEndDate = actualEndDate;
  //     investment.investmentStatus = "active";
  //     investment.lastRoiAt = actualStartDate; // Initialize ROI tracking
  //     await investment.save();

  //     // 8. UPDATE ADMIN TRANSACTION
  //     await this.AdminTransactionModel.updateOne(
  //       { transactionId: investment._id },
  //       { status: "active" }
  //     );

  //     // 9. UPDATE USER TRANSACTION
  //     await this.TransactionModel.updateOne(
  //       {
  //         investmentId: investment._id,
  //         status: "pending",
  //       },
  //       {
  //         status: "active",
  //         description: `${plan.name} investment Deactivated - $${(investment.amount / 100).toFixed(2)} `,
  //       }
  //     );

  //     // 10. SEND NOTIFICATION
  //     await this.NotificationModel.create({
  //       user: investment.userId,
  //       type: "investment",
  //       title: "Investment DeActivated! 🎉",
  //       message: `Your ${plan.name} investment of $${(investment.amount / 100).toFixed(2)} is now deactivated.`,
  //       data: {
  //         investmentId: investment._id,
  //         startDate: actualStartDate,
  //         endDate: actualEndDate,
  //         planName: plan.name,
  //         roi: plan.roi,
  //       },
  //       category: "investment",
  //       icon: "investment",
  //     });

  //     return {
  //       success: true,
  //       message: "Investment cancled and Deactivated successfully",
  //       investment: {
  //         id: investment._id,
  //         amount: investment.amount / 100,
  //         investmentType: investment.investmentType,
  //         planName: plan.name,
  //         roi: investment.roi,
  //         startDate: actualStartDate,
  //         endDate: actualEndDate,
  //         duration: plan.duration,
  //         status: "active",
  //       },
  //       wallet: {
  //         pendingInvestment: wallet.pendingInvestment / 100,
  //         invBalance: wallet.invBalance / 100,
  //         balance: wallet.balance / 100,
  //       },
  //     };
  //   } catch (error) {
  //     console.error("❌ Investment confirmation error:", error.message);
  //     throw error;
  //   }
  // }

  // ======================
  // DAILY ROI PROCESSING (CRON JOB)
  // ======================

  /**
   * Processes daily Return on Investment for all active investments
   * Uses ROI rates from InvestmentPlan model
   */
  async processDailyROI() {
    try {
      const now = new Date();

      // Get all ACTIVE investments
      const investments = await this.InvestmentModel.find({
        investmentStatus: "active",
      });

      console.log(
        investments.length,
        "active investments found for ROI processing",
      );

      console.log(
        `🔄 Processing ROI for ${investments.length} active investments`,
      );

      for (const inv of investments) {
        try {
          // Check if investment has expired
          if (now >= inv.investmentEndDate) {
            await this.completeInvestment(inv._id);
            continue;
          }

          // // Check if we've already processed ROI today
          const lastRun = inv.lastRoiAt || inv.investmentStartDate;
          const hoursSinceLastRun = (now - lastRun) / (1000 * 60 * 60);

          if (hoursSinceLastRun < 24) {
            continue; // Not 24 hours yet
          }

          // Get ROI rate from plan (convert percentage to decimal for calculation)
          const plan = await this.InvestmentPlanModel.findOne({
            planId: inv.investmentType,
          });

          console.log(plan, "plan details for investment", inv._id, inv.amount);

          if (!plan) {
            console.warn(
              `Plan not found for investment type: ${inv.investmentType}`,
            );
            continue;
          }

          // Calculate profit: amount * (roi/100) for daily percentage
          const dailyRate = plan.roi / 100;
          const profit = Math.round(inv.amount * dailyRate);

          // Update investment returns
          inv.TotalReturns = (inv.TotalReturns || 0) + profit;
          inv.lastRoiAt = now;
          await inv.save();

          // Update wallet investment balance
          await this.WalletModel.updateOne(
            { userId: inv.userId },
            { $inc: { invBalance: profit } },
          );

          // Create transaction record
          await this.TransactionModel.create({
            userId: inv.userId,
            transactionId: inv._id,
            type: "profit",
            creditedAmount: profit,
            description: `Daily ROI (${plan.roi}%) for ${plan.name} investment`,
            status: "completed",
          });

          console.log(
            `💰 Credited $${profit / 100} ROI for investment ${inv._id}`,
          );
        } catch (error) {
          console.error(
            `Error processing ROI for investment ${inv._id}:`,
            error.message,
          );
          // Continue with other investments
        }
      }

      console.log(`✅ Completed daily ROI processing`);
    } catch (error) {
      console.error("❌ Daily ROI processing error:", error);
    }
  }

  // ======================
  // INVESTMENT COMPLETION
  // ======================

  /**
   * Completes an investment when it reaches maturity
   * Returns capital + accumulated ROI to user's main balance
   *
   * @param {string|string[]} investmentId - ID(s) of investment(s) to complete
   * @returns {Object|Object[]} - Completed investment(s)
   */
  async completeInvestment(investmentId) {
    // Handle array of IDs
    if (Array.isArray(investmentId)) {
      const results = [];
      for (const id of investmentId) {
        try {
          const res = await this._completeSingleInvestment(id);
          results.push({ id, success: true, investment: res });
        } catch (err) {
          results.push({
            id,
            success: false,
            error: err?.message || String(err),
          });
        }
      }
      return results;
    }

    // Single investment
    return await this._completeSingleInvestment(investmentId);
  }

  /**
   * Internal method to complete a single investment
   */
  async _completeSingleInvestment(investmentId) {
    const investment = await this.InvestmentModel.findById(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    // Only proceed if active
    if (investment.investmentStatus !== "active") {
      return investment;
    }

    // Find user's wallet
    const wallet = await this.WalletModel.findOne({
      userId: investment.userId,
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Calculate total to return (capital + accumulated returns)
    const totalInvBalance = wallet.invBalance || 0;
    const capital = investment.amount || 0;
    const returns =
      totalInvBalance - capital > 0 ? totalInvBalance - capital : 0;

    // Transfer to main balance
    wallet.balance = (wallet.balance || 0) + totalInvBalance;
    wallet.totalReturn = (wallet.totalReturn || 0) + returns;
    wallet.invBalance = wallet.invBalance - totalInvBalance; // Reset to 0
    await wallet.save();

    // Update investment status
    investment.investmentStatus = "completed";
    investment.actualEndDate = new Date();
    await investment.save();

    // Update transactions
    await this.TransactionModel.updateMany(
      { transactionId: investment._id, status: "active" },
      { status: "completed" },
    );

    // Create admin transaction for completion
    await this.AdminTransactionModel.create({
      userId: investment.userId,
      transactionId: investment._id,
      type: "investment_completion",
      creditedAmount: totalInvBalance,
      status: "completed",
      investmentType: investment.investmentType,
    });

    // Send notification
    await this.NotificationModel.create({
      user: investment.userId,
      type: "investment",
      title: "Investment Completed! 🎊",
      message: `Your ${investment.investmentType} investment has completed. $${(totalInvBalance / 100).toFixed(2)} (Capital: $${(capital / 100).toFixed(2)} + Returns: $${(returns / 100).toFixed(2)}) has been credited to your wallet.`,
      data: {
        investmentId: investment._id,
        capital: capital / 100,
        returns: returns / 100,
        total: totalInvBalance / 100,
      },
      category: "investment",
      icon: "investment",
    });

    return {
      investment,
      summary: {
        capital: capital / 100,
        returns: returns / 100,
        total: totalInvBalance / 100,
        status: "completed",
      },
    };
  }

  // ======================
  // ADDITIONAL METHODS
  // ======================

  /**
   * Get user's active investments
   */
  // async getUserActiveInvestments(userId) {
  //   const userObjectId = new mongoose.Types.ObjectId(userId);
  //   return await this.InvestmentModel.find({
  //     userId: userObjectId,
  //     investmentStatus: "active",
  //   }).sort({ investmentStartDate: -1 });
  // }

  // /**
  //  * Get user's investment history
  //  */
  // async getUserInvestmentHistory(userId) {
  //   const userObjectId = new mongoose.Types.ObjectId(userId);
  //   return await this.InvestmentModel.find({
  //     userId: userObjectId,
  //     investmentStatus: { $in: ["completed", "cancelled"] },
  //   }).sort({ investmentEndDate: -1 });
  // }

  /**
   * Cancel a pending investment
   */
  async cancelInvestment(investmentId) {
    const investment = await this.InvestmentModel.findById(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    if (investment.investmentStatus !== "pending") {
      throw new Error(
        `Cannot cancel ${investment.investmentStatus} investment`,
      );
    }

    // Refund to wallet
    const wallet = await this.WalletModel.findOne({
      userId: investment.userId,
    });
    if (wallet) {
      wallet.balance += investment.amount;
      wallet.pendingInvestment -= investment.amount;
      await wallet.save();
    }

    // Update investment
    investment.investmentStatus = "cancelled";
    investment.cancelledAt = new Date();
    await investment.save();

    // Update transactions
    await this.TransactionModel.updateMany(
      { investmentId: investment._id },
      { status: "cancelled" },
    );

    // Send notification
    await this.NotificationModel.create({
      user: investment.userId,
      type: "investment",
      title: "Investment Cancelled",
      message: `Your ${investment.investmentType} investment of $${(investment.amount / 100).toFixed(2)} has been cancelled and refunded.`,
      data: { investmentId: investment._id },
      category: "investment",
      icon: "investment",
    });

    return investment;
  }
}

// ======================
// MODULE EXPORT
// ======================
module.exports = InvestmentService;
