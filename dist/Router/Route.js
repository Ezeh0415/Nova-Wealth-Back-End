"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = require("node-cron");
const express_1 = require("express");
const Auth_1 = require("../Module/Auth/Client/Contr/Auth");
const Auth_2 = require("../Module/Auth/Admin/Contr/Auth");
const ClientContrTransaction_1 = require("../Module/Transaction/Client/Contr/ClientContrTransaction");
const AdminTransactionContr_1 = require("../Module/Transaction/Admin/Contr/AdminTransactionContr/AdminTransactionContr");
const ApiKey_1 = require("../Middleware/ApiKey/ApiKey");
const GetDashboardContr_1 = require("../Module/DashBoard/Client/Contr/GetDashboardContr");
const JWTAUth_1 = require("../config/JWTAUth");
const InvestPlanContr_1 = require("../Module/InvestmentPlan/Contr/InvestPlanContr");
const AdminGetDashboard_1 = require("../Module/DashBoard/Admin/Contr/AdminGetDashboard");
const UpdateNotificationContr_1 = require("../Module/Notification/Contr/UpdateNotificationContr");
const CryptoWalletContr_1 = require("../Module/CryptoWallet/contr/CryptoWalletContr");
const userUpdateContr_1 = require("../Module/UserUpdate/Contr/userUpdateContr");
const KycContr_1 = require("../Module/Kyc/Client/Contr/KycContr");
const KycAdminContr_1 = require("../Module/Kyc/Admin/Contr/KycAdminContr");
const Clientnvestment_1 = require("../Module/Investment/Client/Contr/Clientnvestment");
const AdminInvestContr_1 = require("../Module/Investment/Admin/Contr/AdminInvestContr");
const router = (0, express_1.Router)();
const apiKey = ApiKey_1.ApiKey.getInstance();
const Authenticate = JWTAUth_1.TokenAuth.getInstance();
const authContr = Auth_1.AuthContr.getInstance();
const adminAuthContr = Auth_2.AdminAuthContr.getInstance();
const getDashboardContr = GetDashboardContr_1.GetDashboardContr.getInstance();
const clientTransaction = ClientContrTransaction_1.clientContrTransaction.getInstance();
const AdminTransaction = AdminTransactionContr_1.AdminTransactionContr.getInstance();
const investPlanContr = InvestPlanContr_1.InvestPlanContr.getInstance();
const adminGetDashBoardContr = AdminGetDashboard_1.AdminGetDashBoardContr.getInstance();
const updateNotificationContr = UpdateNotificationContr_1.UpdateNotificationContr.getInstance();
const cryptoWalletContr = CryptoWalletContr_1.CryptoWalletContr.getInstance();
const UserUpdateContr = userUpdateContr_1.userUpdateContr.getInstance();
const KycContr = KycContr_1.kycContr.getInstance();
const adminKycContr = KycAdminContr_1.AdminKycContr.getInstance();
const clientInvestmentContr = Clientnvestment_1.ClientInvestmentContr.getInstance();
const adminInvestContr = AdminInvestContr_1.AdminInvestContr.getInstance();
// client auth section
router.post("/signup", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.SignUp(req, res));
router.post("/login", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.Login(req, res));
router.post("/forgetPassword", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.forgotPassword(req, res));
router.post("/resetPassword", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.resetPassword(req, res));
// KYC SECTION 
router.post("/VerifyKyc", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => KycContr.VerifyKyc(req, res));
// client dashboard
router.get("/dashboard", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => getDashboardContr.getDashBoard(req, res));
// Notification Section 
router.put("/markNotificationAsRead", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => updateNotificationContr.UpdateSingleNotif(req, res));
router.put("/markAllNotificationAsRead", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => updateNotificationContr.updateUserAllNotif(req, res));
// User Transaction section
router.post("/payment", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientTransaction.userDeposit(req, res));
router.post("/withdraw", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientTransaction.userWithdrawal(req, res));
// invest plan
router.post("investPlan", apiKey.RequireApiKey.bind(apiKey), (req, res) => getDashboardContr.getInvestPlan(req, res));
router.post("/createPlan", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => investPlanContr.CreateInvestPlan(req, res));
router.put("/updatePlan/:id", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => investPlanContr.updateInvestPlan(req, res));
router.delete("/deletePlan/:id", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => investPlanContr.DeleteInvestPlan(req, res));
// INVESTMENT SECTION
router.post("/invest", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientInvestmentContr.invest(req, res));
// 
//  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER  ADMIN SECTION ROUTER   ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER
// ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  
// 
// Admin Auth Section
router.post("/AdminSignup", apiKey.RequireApiKey.bind(apiKey), (req, res) => adminAuthContr.AdminSignUp(req, res));
router.post("/AdminLogin", apiKey.RequireApiKey.bind(apiKey), (req, res) => adminAuthContr.AdminLogin(req, res));
// ADMIN KYC SECTION
router.post("/confirmKyc", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminKycContr.ConfirmKyc(req, res));
router.post("/cancleKyc", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminKycContr.CancelKyc(req, res));
// AdminDashBoard Section
router.post("/dashboardAdminUsers", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminGetDashBoardContr.getAdminDashBoardUsers(req, res));
router.post("/dashboardAdminWallets", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminGetDashBoardContr.getAdminDashBoardWallets(req, res));
// Admin Transaction Section
router.post("/Transactions", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.adminGetTransaction(req, res));
router.post("/confirmDeposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.confirmDeposit(req, res));
router.post("/cancleDeposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.cancelDeposit(req, res));
router.post("/confirmWithdraw", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.confirmWithdrawal(req, res));
// ADMIN CRYPTO WALLET SECTION
router.get("/getWallets", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => cryptoWalletContr.getCryptoWallet(req, res));
router.post("/addWallet", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => cryptoWalletContr.createCryptoWallet(req, res));
router.post("/updateWallet", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => cryptoWalletContr.updateCryptoWallet(req, res));
router.post("/deleteWallet", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => cryptoWalletContr.deleteCryptoWallet(req, res));
// USER UPDATE
router.post("/getAdminUser", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => UserUpdateContr.AdminGetUser(req, res));
router.post("/updateFile", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => UserUpdateContr.AdminUpdateUser(req, res));
// INVESTMENT SECTION 
router.post("/confirmInvest", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminInvestContr.confirmInvestment(req, res));
router.post("/cancelInvest", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminInvestContr.cancelInvestment(req, res));
const CRON_SCHEDULE = "*/2 * * * *"; // Every 2 minutes
const cronOptions = {
    scheduled: true,
    timezone: "Africa/Lagos",
    recoverMissedExecutions: false,
};
// INVESTMENT PROCESSING SECTION
(0, node_cron_1.schedule)(CRON_SCHEDULE, () => {
    try {
        console.log(`Processing ROI at: ${new Date().toISOString()}`);
        adminInvestContr.processDailyROI(undefined, undefined);
    }
    catch (error) {
        console.error('Error processing ROI:', error);
    }
}, cronOptions);
exports.default = router;
