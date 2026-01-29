// ======================
// ADMIN DASHBOARD SERVICE CLASS
// ======================
// Handles administrative dashboard operations for system monitoring and management
// Provides aggregated data views for administrators to monitor platform health and user activity
// Note: Currently has significant logical issues that need to be addressed
class AdminDashboard {
  constructor({ WalletModel, TransactionModel, InvestmentModel, UserModel }) {
    // Initialize model dependencies for admin data aggregation
    this.WalletModel = WalletModel; // All user wallets for financial overview
    this.TransactionModel = TransactionModel; // Transaction monitoring
    this.InvestmentModel = InvestmentModel; // Investment tracking and analytics
    this.UserModel = UserModel; // User management and statistics
  }

  // ======================
  // USER MANAGEMENT DASHBOARD
  // ======================

  /**
   * Retrieves administrative user and investment data for dashboard display
   * Intended to provide admins with overview of users, investments, and platform metrics
   *
   * @param {string} userId - ID of the admin user requesting the data
   * @returns {Promise<Object>} - Aggregated admin dashboard data including:
   *   - users: Array of all users with selected fields
   *   - totalUser: Total count of all users in the system
   *   - totalInvestment: Total count of all investment records
   *   - investments: Array of all investment documents
   * @throws {Error} - If user is not admin, or no users found
   *
   * CRITICAL ISSUES TO ADDRESS:
   * 1. ADMIN CHECK: Only checks role field, no JWT or permission validation
   * 2. PERFORMANCE: Fetches ALL users and ALL investments without pagination
   * 3. DATA LEAK: Returns ALL user data to admin (email, name, etc.)
   * 4. INCONSISTENT: getAdminDashBoardWallets filters by userId, this doesn't
   * 5. SECURITY: Minimal authorization check
   *
   * Workflow:
   * 1. Verify requesting user has admin role
   * 2. Fetch all users with limited fields
   * 3. Count total users
   * 4. Count total investments
   * 5. Fetch ALL investment records
   *
   * Usage Example (with fixes):
   * const adminDashboard = new AdminDashboard(models);
   * const dashboardData = await adminDashboard.getAdminDashboardUsers(adminUserId);
   */
  async getAdminDashboardUsers(userId) {
    // 1. ADMIN VERIFICATION - Check if requesting user is admin
    // ISSUE: Only checks database role, no token validation or additional checks
    const isAdmin = await this.UserModel.findById(userId).select("role");

    // Verify user exists and has admin role
    if (!isAdmin || isAdmin.role !== "admin") {
      throw new Error("Unauthorized access");
    }

    // 2. USER DATA - Fetch all users with selected fields
    // WARNING: No pagination - could return thousands of records
    const users = await this.UserModel.find().select(
      "fullName userName email role createdAt",
    );

    // Check if users were found (empty array is valid, not an error)
    if (!users) {
      throw new Error("No users found");
    }

    // 3. PLATFORM METRICS - Count total users and investments
    const totalUser = await this.UserModel.countDocuments();
    const totalInvestment = await this.InvestmentModel.countDocuments();

    // 4. INVESTMENT DATA - Fetch ALL investment records
    // WARNING: No pagination - could be performance issue with many investments
    const investments = await this.InvestmentModel.find();

    // 5. RETURN AGGREGATED DATA
    return {
      users, // All users' personal information
      totalUser, // Total user count
      totalInvestment, // Total investment count
      investments, // All investment records (could be huge)
    };
  }

  // ======================
  // WALLET MANAGEMENT DASHBOARD
  // ======================

  /**
   * Retrieves wallet information for admin dashboard
   * Intended to show wallet balances and financial status
   *
   * @param {string} userId - ID of the admin user requesting the data
   * @returns {Promise<Object>} - Wallet data for admin review
   *   - wallets: Array of wallet documents
   * @throws {Error} - If no wallets found
   *
   * CRITICAL ISSUES TO ADDRESS:
   * 1. LOGICAL ERROR: Filters wallets by userId (admin's ID), not all wallets
   *    Should be: this.WalletModel.find() to get ALL wallets
   * 2. MISSING ADMIN CHECK: No verification that requester is admin
   * 3. NO PAGINATION: Could return many wallet records
   * 4. LIMITED DATA: Only selects balance and createdAt fields
   *
   * Workflow (CURRENT - INCORRECT):
   * 1. Finds wallets only for the admin user (should be all users' wallets)
   * 2. Returns wallet data
   *
   * Intended Workflow (CORRECTED):
   * 1. Verify admin authorization
   * 2. Fetch ALL wallets from all users
   * 3. Return aggregated wallet data
   *
   * Usage Example (with fixes):
   * const walletData = await adminDashboard.getAdminDashBoardWallets(adminUserId);
   */
  async getAdminDashBoardWallets(userId) {
    // BUG: This only gets wallets for the admin user, not all users' wallets
    // Should be: await this.WalletModel.find() to get ALL wallets
    const wallets = await this.WalletModel.find({ userId }).select(
      "balance createdAt",
    );

    // Check if wallets found (but only checking admin's own wallets due to bug)
    if (!wallets) {
      throw new Error("No wallets found");
    }

    return {
      wallets, // Currently only returns admin's own wallets, not all users' wallets
    };
  }
}

// ======================
// MODULE EXPORT
// ======================
module.exports = AdminDashboard;

// ======================
// KEY ARCHITECTURE NOTES:
// ======================
// 1. ADMIN-ONLY ACCESS: Methods should only be accessible by admin users
// 2. DATA AGGREGATION: Combines data from multiple collections for admin overview
// 3. MONITORING FOCUS: Designed for system monitoring, not detailed analytics
// 4. CURRENT STATE: Has critical bugs that need immediate fixing

// ======================
// CRITICAL BUGS TO FIX:
// ======================
// 1. getAdminDashBoardWallets() filters by userId instead of fetching all wallets
// 2. Missing admin verification in getAdminDashBoardWallets()
// 3. No pagination in either method (risk of memory issues with large datasets)
// 4. Potentially exposes sensitive user data without proper authorization

// ======================
// RECOMMENDED IMPROVEMENTS:
// ======================
// 1. Add comprehensive admin authorization (JWT + role + permissions)
// 2. Implement pagination for all list endpoints
// 3. Add data filtering and sorting options
// 4. Include more comprehensive metrics:
//    - Active/inactive user counts
//    - Total platform balance
//    - Daily/weekly transaction volumes
//    - Investment performance metrics
//    - User growth trends
// 5. Add data export functionality
// 6. Implement data caching for frequently accessed admin data
// 7. Add audit logging for admin dashboard access

// ======================
// SECURITY CONSIDERATIONS:
// ======================
// 1. Always validate admin permissions at multiple levels
// 2. Consider implementing role-based access control (RBAC)
// 3. Log all admin dashboard access for audit trails
// 4. Implement rate limiting on admin endpoints
// 5. Consider IP whitelisting for admin access
// 6. Sanitize all inputs to prevent injection attacks
// 7. Encrypt sensitive user data in responses

// ======================
// TYPICAL USAGE FLOW (CORRECTED):
// ======================
// 1. Admin logs into admin panel
// 2. Frontend sends request with admin JWT token
// 3. Controller verifies JWT and admin role
// 4. Controller calls admin dashboard service methods
// 5. Service performs additional authorization checks
// 6. Service aggregates data with pagination
// 7. Controller returns formatted response
// 8. Frontend displays admin dashboard with metrics and charts

// ======================
// POTENTIAL ADDITIONAL METHODS:
// ======================
// 1. getPlatformMetrics() - Overall platform health and KPIs
// 2. getFinancialOverview() - Total balances, pending transactions, etc.
// 3. getUserActivity() - Recent user actions and login activity
// 4. getTransactionAnalytics() - Transaction patterns and volumes
// 5. getInvestmentPerformance() - ROI analysis and investment trends
// 6. getSystemHealth() - Database status, server metrics, error rates

// ======================
// PERFORMANCE OPTIMIZATION:
// ======================
// 1. Use MongoDB aggregation for complex metrics
// 2. Implement server-side pagination
// 3. Cache frequently accessed admin data
// 4. Use projection to limit returned fields
// 5. Consider read replicas for admin queries
// 6. Implement lazy loading for large datasets
