// ======================
// DASHBOARD SERVICE CLASS
// ======================
// Handles retrieval and aggregation of user dashboard data
// Provides a consolidated view of user's financial status and activities
// This service aggregates data from multiple collections for dashboard display
class DashboardService {
  constructor({ WalletModel, TransactionModel, InvestmentModel, UserModel }) {
    // Initialize model dependencies for data retrieval
    this.WalletModel = WalletModel;           // User wallet/balance information
    this.TransactionModel = TransactionModel; // Transaction history
    this.InvestmentModel = InvestmentModel;   // Investment records
    this.UserModel = UserModel;               // User account information
  }

  // ======================
  // DASHBOARD DATA AGGREGATION
  // ======================

  /**
   * Retrieves and aggregates all dashboard data for a specific user
   * Fetches data from multiple collections and compiles into a single response
   * 
   * @param {string} userId - MongoDB ObjectId of the user
   * @returns {Promise<Object>} - Consolidated dashboard data object containing:
   *   - wallet: User's wallet/balance information
   *   - investments: Array of user's investment records
   *   - transactions: Recent transaction history
   *   - profits: Total profit calculated from transactions
   *   - accountStatus: User account verification status
   * 
   * Workflow:
   * 1. Fetch user's wallet/balance data
   * 2. Fetch all user investments (sorted by most recent)
   * 3. Fetch recent transactions (last 10, sorted by most recent)
   * 4. Calculate total profits from transaction history
   * 5. Fetch user account status (verification status)
   * 6. Return all data in a structured format
   * 
   * Performance Considerations:
   * - Multiple database queries (consider optimization for high-traffic)
   * - No pagination on investments (could be large dataset)
   * - Profit calculation done in-memory (could be heavy for many transactions)
   * 
   * Usage Example:
   * const dashboardService = new DashboardService(models);
   * const dashboardData = await dashboardService.getDashboard('507f1f77bcf86cd799439011');
   * 
   * Returns:
   * {
   *   wallet: { balance: 1500, currency: 'USD', ... },
   *   investments: [{ amount: 500, type: 'basic', ... }, ...],
   *   transactions: [{ type: 'deposit', amount: 100, ... }, ...],
   *   profits: 250,
   *   accountStatus: { isVerified: true }
   * }
   */
  async getDashboard(userId) {
    // 1. WALLET DATA - User's financial balance
    // Find user's wallet or create default if not found
    // Note: Uses short-circuit OR to provide default empty wallet
    const wallet = (await this.WalletModel.findOne({ userId })) || {
      balance: 0, // Default balance if no wallet exists
    };

    // 2. INVESTMENT DATA - All user investments
    // Fetch all investments for this user, sorted by creation date (newest first)
    const investments = await this.InvestmentModel.find({ userId }).sort({
      createdAt: -1, // -1 = descending order (most recent first)
    });

    // 3. RECENT TRANSACTIONS - Latest 10 transactions
    // Fetch most recent transactions for activity feed
    const transactions = await this.TransactionModel.find({ userId })
      .sort({ createdAt: -1 })   // Most recent first
      .limit(10);                // Limit to 10 records for dashboard display

    // 4. PROFIT CALCULATION - Sum of all profit transactions
    // Filter transactions to find profit types and sum their amounts
    // Note: Assumes 'profit' is a transaction type and 'amount' field exists
    const profits = transactions
      .filter((t) => t.type === "profit")    // Only include profit transactions
      .reduce((sum, t) => sum + t.amount, 0); // Sum all profit amounts

    // 5. ACCOUNT STATUS - User verification information
    // Fetch minimal user data for account status display
    const user = await this.UserModel.findById(userId).select("isVerified");

    // 6. RETURN AGGREGATED DATA
    // Compile all data into a single dashboard response object
    return {
      wallet,           // Wallet balance and details
      investments,      // All investment records
      transactions,     // Recent transaction history
      profits,          // Calculated total profits
      accountStatus: user, // User verification status
    };
  }

  // ================================================================
  // POTENTIAL ENHANCEMENTS/ADDITIONAL METHODS (NOT IMPLEMENTED YET)
  // ================================================================
  
  // Uncomment and implement these methods if needed:

  /**
   * Get summarized dashboard data (for faster loading)
   * Returns only essential information without full transaction/investment lists
   * 
   * @param {string} userId - User ID
   * @returns {Object} - Summarized dashboard stats
   */
  // async getDashboardSummary(userId) {
  //   const [
  //     wallet,
  //     investmentCount,
  //     totalInvested,
  //     recentTransactions,
  //     user
  //   ] = await Promise.all([
  //     this.WalletModel.findOne({ userId }),
  //     this.InvestmentModel.countDocuments({ userId, status: 'active' }),
  //     this.InvestmentModel.aggregate([
  //       { $match: { userId: mongoose.Types.ObjectId(userId) } },
  //       { $group: { _id: null, total: { $sum: '$amount' } } }
  //     ]),
  //     this.TransactionModel.find({ userId })
  //       .sort({ createdAt: -1 })
  //       .limit(5),
  //     this.UserModel.findById(userId).select('isVerified email fullName')
  //   ]);
  // 
  //   return {
  //     balance: wallet?.balance || 0,
  //     activeInvestments: investmentCount,
  //     totalInvested: totalInvested[0]?.total || 0,
  //     recentActivity: recentTransactions,
  //     userInfo: user
  //   };
  // }

  /**
   * Get financial statistics for charts/graphs
   * 
   * @param {string} userId - User ID
   * @param {string} period - Time period ('7d', '30d', '90d', '1y')
   * @returns {Object} - Financial statistics
   */
  // async getFinancialStats(userId, period = '30d') {
  //   const dateFilter = getDateFilter(period); // Helper function to calculate date range
  //   
  //   const stats = await this.TransactionModel.aggregate([
  //     {
  //       $match: {
  //         userId: mongoose.Types.ObjectId(userId),
  //         createdAt: { $gte: dateFilter.start, $lte: dateFilter.end }
  //       }
  //     },
  //     {
  //       $group: {
  //         _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
  //         deposits: {
  //           $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] }
  //         },
  //         withdrawals: {
  //           $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] }
  //         },
  //         profits: {
  //           $sum: { $cond: [{ $eq: ['$type', 'profit'] }, '$amount', 0] }
  //         }
  //       }
  //     },
  //     { $sort: { _id: 1 } }
  //   ]);
  //   
  //   return stats;
  // }

  /**
   * Get investment performance metrics
   * 
   * @param {string} userId - User ID
   * @returns {Object} - Investment performance data
   */
  // async getInvestmentPerformance(userId) {
  //   const investments = await this.InvestmentModel.find({ userId });
  //   
  //   const performance = investments.map(inv => ({
  //     id: inv._id,
  //     type: inv.investmentType,
  //     amount: inv.amount,
  //     startDate: inv.investmentStartDate,
  //     endDate: inv.investmentEndDate,
  //     returns: inv.TotalReturns || 0,
  //     roiPercentage: ((inv.TotalReturns || 0) / inv.amount) * 100,
  //     status: inv.investmentStatus
  //   }));
  //   
  //   const totalReturns = performance.reduce((sum, inv) => sum + inv.returns, 0);
  //   const averageROI = performance.length > 0 
  //     ? performance.reduce((sum, inv) => sum + inv.roiPercentage, 0) / performance.length
  //     : 0;
  //   
  //   return {
  //     investments: performance,
  //     summary: {
  //       totalInvested: investments.reduce((sum, inv) => sum + inv.amount, 0),
  //       totalReturns,
  //       averageROI,
  //       activeCount: investments.filter(inv => inv.status === 'active').length
  //     }
  //   };
  // }
}

// ======================
// MODULE EXPORT
// ======================
module.exports = DashboardService;

// ======================
// KEY ARCHITECTURE NOTES:
// ======================
// 1. DATA AGGREGATION: Combines data from 4 different collections
// 2. READ-ONLY OPERATIONS: Only fetches data, never modifies
// 3. USER-CENTRIC: All queries filter by userId for data isolation
// 4. PERFORMANCE: Multiple independent queries (could be parallelized)
// 5. SIMPLICITY: Straightforward data retrieval without complex transformations

// ======================
// IMPORTANT NOTES:
// ======================
// 1. ERROR HANDLING: No error handling in current implementation
// 2. PERFORMANCE: Consider adding indexes on userId fields for all models
// 3. SCALABILITY: For users with many investments/transactions, consider:
//    - Pagination for investments
//    - Caching dashboard data
//    - Background pre-calculation of profits
// 4. DATA FRESHNESS: Real-time data - consider if caching is needed
// 5. SECURITY: All queries use userId parameter - ensure it's validated/sanitized

// ======================
// POTENTIAL IMPROVEMENTS:
// ======================
// 1. Add error handling with try-catch
// 2. Implement data caching for frequently accessed dashboards
// 3. Add pagination for investments and transactions
// 4. Consider using MongoDB aggregation for profit calculation
// 5. Add performance monitoring and logging
// 6. Consider implementing a dashboard cache that updates periodically
// 7. Add support for different currency conversions
// 8. Include more comprehensive financial metrics

// ======================
// TYPICAL USAGE FLOW:
// ======================
// 1. User logs into application
// 2. Frontend calls /api/dashboard endpoint
// 3. Controller receives request with user ID from JWT
// 4. Controller calls getDashboard(userId)
// 5. Service aggregates data from multiple collections
// 6. Controller returns formatted response to frontend
// 7. Frontend displays dashboard with wallet, investments, transactions, etc.

// ======================
// DATA RELATIONSHIPS:
// ======================
// User → has one → Wallet
// User → has many → Investments
// User → has many → Transactions
// Investment → generates → Transaction (profit type)