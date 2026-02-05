const Router = require("express").Router();
const cron = require("node-cron");

// ======================
// CONTROLLER IMPORTS
// ======================
// Import controller classes that handle request logic for each feature
const SignUpController = require("../Controller/SignUpContr/SignUp");
const AdminSignupController = require("../Controller/AdminSignUpContr/AdminSignup");
const LoginController = require("../Controller/LoginContr/Login");
const AdminLoginController = require("../Controller/AdminLoginContr/AdminLoginContr");
const ForgotPasswordController = require("../Controller/ForgotPasswordContr/ForgotPassword");
const DashBoardContr = require("../Controller/DashBoardContr/DashBoardContr");
const InvestmentContr = require("../Controller/InvestmentContr/Investment");
const CryptoWalletContr = require("../Controller/CryptoWalletContr/CryptoWallet");
const ReferralContr = require("../Controller/ReferralContr/Referral");
const AdminDashboardContr = require("../Controller/AdminDashboard/AdminDashboard");
const MarkNotificationUpdate = require("../Controller/MarkNotificationUpdateContr/MarkNotificationUpdate");

// ======================
// SERVICE IMPORTS
// ======================
// Import service classes that contain business logic and database operations
const SignUpService = require("../Service/SignUpService/SignUp");
const AdminSignupService = require("../Service/AdminSignupService/AdminSignUpService");
const LoginService = require("../Service/LoginService/Login");
const AdminLoginService = require("../Service/AdminLoginService/AdminLoginService");
const ForgotPasswordService = require("../Service/forgotPassword/forgotPassword");
const DashBoardService = require("../Service/DashBoardService/DashBoardService");
const WalletService = require("../Service/TransactionService/Transaction");
const InvestmentService = require("../Service/InvestmentService/investment");
const CryptoWalletService = require("../Service/CryptoWalletService/CryptoWallet");
const AdminDashboardService = require("../Service/AdminDashboard/AdminDashboard");
const ReferralService = require("../Service/ReferalLink/ReferalLink");
const ReadNotification = require("../Service/ReadNotificarion/ReadNotification");

// ======================
// MODEL/SCHEMA IMPORTS
// ======================
// Import Mongoose models for database operations
const User = require("../Models/UserSchema"); // User collection
const WalletSchema = require("../Models/WalletSchema"); // Wallet collection
const TransactionSchema = require("../Models/TransactionSchema"); // User transactions
const InvestmentSchema = require("../Models/InvestmentSchema"); // Investments
const AdminTransactionSchema = require("../Models/AdminTransactionSchema"); // Admin transactions
const CryptoWalletSchema = require("../Models/CryptoWalletSchema"); // Crypto wallets
const ResetToken = require("../Models/ResetToken"); // Password reset tokens
const SecurityLog = require("../Models/SecurityLog"); // Security audit logs
const Referral = require("../Models/Referral"); // Referrals
const Notification = require("../Models/Notification"); // Notifications

// ======================
// MIDDLEWARE IMPORTS
// ======================
// Import middleware functions for authentication, validation, etc.
const Require_jwt_key = require("../../middlewares/JWT-key"); // JWT authentication
const Require_Api_key = require("../../middlewares/Api-key"); // API key validation
const validate = require("../../middlewares/validate"); // Validation middleware

// ======================
// VALIDATOR IMPORTS
// ======================
// Import validation schemas for request body validation
const Payment = require("../Controller/paymentConfirm/payment");
const {
  investmentValidator,
} = require("../../middlewares/Validators/InvestmentValidator");
const {
  registerValidator,
} = require("../../middlewares/Validators/RegisterValidator");
const {
  loginValidator,
} = require("../../middlewares/Validators/LoginValidator");
const {
  paymentValidator,
} = require("../../middlewares/Validators/paymentValidator");
const {
  creditTransactionValidator,
} = require("../../middlewares/Validators/TransactionValidator");
const { CancleDeposit } = require("../../middlewares/Validators/CancleDeposit");
const refreshToken = require("../../middlewares/JWT-refresh"); // Token refresh middleware
const { resetPassword } = require("../../middlewares/Validators/resetPassword");
const {
  AdminLoginValidator,
} = require("../../middlewares/Validators/AdminLoginValidation");
const verifyRecaptcha = require("../../middlewares/VerifyRecaptcha"); // Google reCAPTCHA
const {
  resetPasswordLimiter,
} = require("../../middlewares/ResetPasswordLimiter"); // Rate limiting

// ======================
// SERVICE INSTANTIATION
// ======================
// Create service instances by injecting required models
// Each service handles specific business logic domain

// User authentication services
const SignupService = new SignUpService({
  UserModel: User,
  WalletModel: WalletSchema,
  NotificationModel: Notification,
  ReferralModel: Referral,
  TransactionModel: TransactionSchema, // Transaction records
}); // User registration
const adminSignupService = new AdminSignupService(User); // Admin registration
const Loginservice = new LoginService(User); // User login
const adminLoginService = new AdminLoginService(User); // Admin login

const referralService = new ReferralService({
  userModel: User,
  referralModel: Referral,
  NotificationModel: Notification,
});

// Forgot password service with multiple dependencies
const forgotPasswordService = new ForgotPasswordService({
  userModel: User, // User operations
  ResetToken: ResetToken, // Token management
  SecurityLog: SecurityLog, // Security logging
  NotificationModel: Notification, // Notifications
});

// Dashboard service with multiple model dependencies
const dashboardService = new DashBoardService({
  WalletModel: WalletSchema, // User wallet data
  TransactionModel: TransactionSchema, // User transactions
  InvestmentModel: InvestmentSchema, // User investments
  UserModel: User, // User information
  NotificationModel: Notification, // Notifications
});

// Payment/transaction service
const paymentService = new WalletService({
  userModel: User, // User operations
  WalletModel: WalletSchema, // Wallet updates
  TransactionModel: TransactionSchema, // Transaction records
  AdminTransactionModel: AdminTransactionSchema, // Admin transaction records
  NotificationModel: Notification, // Notifications
});

// Investment service with all related models
const investmentService = new InvestmentService({
  userModels: User, // User operations
  AdminTransactionModel: AdminTransactionSchema, // Admin transactions
  InvestmentModel: InvestmentSchema, // Investment records
  WalletModel: WalletSchema, // Wallet updates
  TransactionModel: TransactionSchema, // Transaction records
  NotificationModel: Notification, // Notifications
});

// Crypto wallet service
const cryptoWalletService = new CryptoWalletService(CryptoWalletSchema);

// Admin dashboard service
const dashboardAdminService = new AdminDashboardService({
  WalletModel: WalletSchema, // All wallets
  TransactionModel: TransactionSchema, // All transactions
  InvestmentModel: InvestmentSchema, // All investments
  UserModel: User, // All users
});

const readNotification = new ReadNotification(Notification);

// ======================
// CONTROLLER INSTANTIATION
// ======================
// Create controller instances by injecting corresponding services
// Controllers handle HTTP requests and responses

const SignupController = new SignUpController(SignupService);
const adminSignupController = new AdminSignupController(adminSignupService);
const Logincontroller = new LoginController(Loginservice);
const adminLoginController = new AdminLoginController(adminLoginService);
const referralController = new ReferralContr(referralService);
const forgotPasswordController = new ForgotPasswordController(
  forgotPasswordService,
);
const DashBoardController = new DashBoardContr(dashboardService);
const payment = new Payment(paymentService);
const investmentController = new InvestmentContr(investmentService);
const cryptoWalletController = new CryptoWalletContr(cryptoWalletService);
const DashBoardAdminController = new AdminDashboardContr(dashboardAdminService);
const markNotificationUpdate = new MarkNotificationUpdate(readNotification);

// const MarkAsRead = require("../Controller/MarkAsReadContr/MarkAsReadContr");
// const MarkNotificationAsReadService = require("../Service/markNotificationAsRead/markNotificationAsReadService");
// ======================
// ROUTE DEFINITIONS
// ======================

// ======================
// PUBLIC ROUTES (No Authentication Required)
// ======================

// User Registration
// Path: POST /api/signup
// Middleware chain: validate registration data → check API key → process signup
Router.post(
  "/signup",
  Require_Api_key, // Validate API key in request
  SignupController.signUp, // Handle signup logic
);

// User Login
// Path: POST /api/login
// Middleware chain: validate login data → check API key → process login
Router.post(
  "/login",
  loginValidator, // Validate login credentials format
  validate, // Run validation middleware
  Require_Api_key, // Validate API key
  Logincontroller.login, // Handle login logic
);

// Forgot Password Request
// Path: POST /api/forgotPassword
// Middleware chain: rate limit → check API key → process forgot password
Router.post(
  "/forgotPassword",
  resetPasswordLimiter, // Prevent brute force attacks with rate limiting
  Require_Api_key, // Validate API key
  forgotPasswordController.forgotPassword, // Send reset email
);

// Password Reset
// Path: POST /api/resetPassword
// Middleware chain: validate reset data → check API key → process reset
Router.post(
  "/resetPassword",
  resetPassword, // Validate reset token and new password
  validate, // Run validation middleware
  Require_Api_key, // Validate API key
  forgotPasswordController.resetPassword, // Update password in database
);

// ======================
// PROTECTED USER ROUTES (Require JWT Authentication)
// ======================

// User Dashboard
// Path: GET /api/dashboard
// Middleware chain: check API key → verify JWT → fetch dashboard data
Router.get(
  "/dashboard",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token (user authentication)
  DashBoardController.getDashboard, // Fetch user dashboard data
);

// User referral link creation
// Path: POST /api/createReferralLink
// Middleware chain: check API key → verify JWT → create referral link
Router.post(
  "/createReferralLink",
  Require_jwt_key, // Verify JWT token (user authentication)
  Require_Api_key, // Validate API key
  referralController.createReferralLink, // Handle login logic
);

// Deposit Request
// Path: POST /api/payment
// Middleware chain: validate payment data → check API key → verify JWT → process deposit
Router.post(
  "/payment",
  paymentValidator, // Validate payment information
  validate, // Run validation middleware
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  payment.requestDeposit, // Process deposit request
);

// Withdrawal Request
// Path: POST /api/withdraw
// Middleware chain: check API key → verify JWT → process withdrawal
Router.post(
  "/withdraw",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  payment.WithdrawalRequest, // Process withdrawal request
);

// Investment Request
// Path: POST /api/invest
// Middleware chain: check API key → validate investment → verify JWT → process investment
Router.post(
  "/invest",
  Require_Api_key, // Validate API key
  investmentValidator, // Validate investment data
  validate, // Run validation middleware
  Require_jwt_key, // Verify JWT token
  investmentController.invest, // Process investment
);

Router.put(
  "/markNotificationAsRead",
  Require_Api_key, // Validate API key
  // Require_jwt_key, // Verify JWT token
  markNotificationUpdate.UpdateSingleNotification, // Mark notification as read
);

Router.put(
  "/markAllNotificationAsRead",
  Require_Api_key, // Validate API key
  // Require_jwt_key, // Verify JWT token
  markNotificationUpdate.UpdateAllNotifications, // Mark notification as read
);

// ======================
// BACKGROUND TASK (CRON JOB)
// ======================

// ROI Processing - Runs every 2 minutes
// This calculates and distributes daily returns on investments
cron.schedule(
  "*/2 * * * *", // Cron expression: every 2 minutes
  () => {
    console.log(`Processing ROI at: ${new Date().toISOString()}`);
    investmentController.processDailyROI(); // Process ROI for all investments
  },
  {
    scheduled: true,
    timezone: "Africa/Lagos", // Set timezone for consistent scheduling
    recoverMissedExecutions: false, // Don't run missed jobs to prevent overload
  },
);

// ======================
// TOKEN MANAGEMENT
// ======================

// Refresh JWT Token
// Path: POST /api/refreshToken
// Middleware: check API key → refresh token
Router.post("/refreshToken", Require_Api_key, refreshToken);

// ======================
// CRYPTO WALLET MANAGEMENT
// ======================

// Get Crypto Wallets
// Path: GET /api/getWallets
// Middleware chain: check API key → verify JWT → fetch wallets
Router.get(
  "/getWallets",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  cryptoWalletController.getCryptoWallet, // Fetch user's crypto wallets
);

// ======================
// ADMIN ROUTES (Admin Authentication Required)
// ======================

// Get All Transactions (Admin)
// Path: GET /api/Transactions
// Middleware chain: check API key → verify JWT → fetch all transactions
Router.get(
  "/Transactions",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token (admin auth)
  payment.AdminGetTransaction, // Fetch all transactions for admin view
);

// Admin Dashboard - Users
// Path: POST /api/dashboardAdminUsers
// Middleware chain: check API key → verify JWT → fetch user statistics
Router.post(
  "/dashboardAdminUsers",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  DashBoardAdminController.getAdminDashboardUsers, // Get user analytics
);

// Admin Dashboard - Wallets
// Path: POST /api/dashboardAdminWallets
// Middleware chain: check API key → verify JWT → fetch wallet statistics
Router.post(
  "/dashboardAdminWallets",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  DashBoardAdminController.getAdminDashBoardWallets, // Get wallet analytics
);

// Admin Registration
// Path: POST /api/AdminSignup
// Middleware chain: validate data → check API key → create admin
Router.post(
  "/AdminSignup",
  registerValidator, // Validate admin registration data
  validate, // Run validation middleware
  Require_Api_key, // Validate API key
  adminSignupController.signUp, // Create admin account
);

// Admin Login
// Path: POST /api/AdminLogin
// Middleware chain: validate data → check API key → admin login
Router.post(
  "/AdminLogin",
  AdminLoginValidator, // Validate admin login credentials
  validate, // Run validation middleware
  Require_Api_key, // Validate API key
  adminLoginController.login, // Admin authentication
);

// Confirm Withdrawal (Admin)
// Path: POST /api/confirmWithdraw
// Middleware chain: check API key → verify JWT → confirm withdrawal
Router.post(
  "/confirmWithdraw",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  payment.confirmWithdrawal, // Admin approves withdrawal
);

// Add Crypto Wallet (Admin)
// Path: POST /api/addWallet
// Middleware chain: check API key → verify JWT → add wallet
Router.post(
  "/addWallet",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  cryptoWalletController.CreateCryptoWallet, // Add new crypto wallet
);

// Update Crypto Wallet (Admin)
// Path: POST /api/updateWallet
// Middleware chain: check API key → verify JWT → update wallet
Router.post(
  "/updateWallet",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  cryptoWalletController.UpdateCryptoWallet, // Update existing wallet
);

// Delete Crypto Wallet (Admin)
// Path: POST /api/deleteWallet
// Middleware chain: check API key → verify JWT → delete wallet
Router.post(
  "/deleteWallet",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  cryptoWalletController.DeleteCryptoWallet, // Remove wallet
);

// Confirm Deposit (Admin)
// Path: POST /api/confirmDeposit
// Middleware chain: check API key → verify JWT → confirm deposit
Router.post(
  "/confirmDeposit",
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  payment.confirmDeposit, // Admin confirms user deposit
);

// Cancel Deposit (Admin)
// Path: POST /api/cancleDeposit
// Middleware chain: validate data → check API key → verify JWT → cancel deposit
Router.post(
  "/cancleDeposit",
  CancleDeposit, // Validate cancellation request
  validate, // Run validation middleware
  Require_Api_key, // Validate API key
  Require_jwt_key, // Verify JWT token
  payment.cancleDeposit, // Admin cancels deposit
);

// ======================
// AUTHENTICATION MANAGEMENT
// ======================

// User Logout
// Path: POST /api/logout
// Clears refresh token cookie to log user out
Router.post("/logout", (req, res) => {
  // Clear the refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
  });

  return res.status(200).json({
    message: "Logged out successfully",
    success: true,
  });
});

// ======================
// MODULE EXPORT
// ======================
module.exports = Router;

// ======================
// KEY ARCHITECTURE NOTES:
// ======================
// 1. Layered Architecture: Routes → Controllers → Services → Models
// 2. Middleware Flow: Validation → Authentication → Business Logic
// 3. Dependency Injection: Services injected into Controllers, Models injected into Services
// 4. Separation of Concerns:
//    - Routes: Define endpoints and middleware chain
//    - Controllers: Handle HTTP requests/responses
//    - Services: Contain business logic
//    - Models: Define data structure and database operations
// 5. Security Features:
//    - API key validation on all routes
//    - JWT authentication for protected routes
//    - Rate limiting on sensitive endpoints
//    - Input validation on all user inputs
//    - Secure cookie handling for refresh tokens
// 6. Background Processing: ROI calculation runs via cron job every 2 minutes
// 7. Admin/User Separation: Different routes and controllers for admin vs user operations
// 8. Error Handling: Validation middleware catches errors before reaching controllers
