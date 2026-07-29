import express from "express";
import { schedule } from 'node-cron';
import { Router } from "express";
import { AuthContr } from "../Module/Auth/Client/Contr/Auth";
import { AdminAuthContr } from "../Module/Auth/Admin/Contr/Auth";
import { clientContrTransaction } from "../Module/Transaction/Client/Contr/ClientContrTransaction";
import { AdminTransactionContr } from "../Module/Transaction/Admin/Contr/AdminTransactionContr/AdminTransactionContr";
import { ApiKey } from "../Middleware/ApiKey/ApiKey";
import { GetDashboardContr } from "../Module/DashBoard/Client/Contr/GetDashboardContr";
import { TokenAuth } from "../config/JWTAUth";
import { InvestPlanContr } from "../Module/InvestmentPlan/Contr/InvestPlanContr";
import { AdminGetDashBoardContr } from "../Module/DashBoard/Admin/Contr/AdminGetDashboard";
import { UpdateNotificationContr } from "../Module/Notification/Contr/UpdateNotificationContr";
import { CryptoWalletContr } from "../Module/CryptoWallet/contr/CryptoWalletContr";
import { userUpdateContr } from "../Module/UserUpdate/Contr/userUpdateContr";
import { kycContr } from "../Module/Kyc/Client/Contr/KycContr";
import { AdminKycContr } from "../Module/Kyc/Admin/Contr/KycAdminContr";
import { ClientInvestmentContr } from "../Module/Investment/Client/Contr/Clientnvestment";
import { AdminInvestContr } from "../Module/Investment/Admin/Contr/AdminInvestContr";

const router = Router();
const apiKey = ApiKey.getInstance();
const Authenticate = TokenAuth.getInstance();
const authContr = AuthContr.getInstance();
const adminAuthContr = AdminAuthContr.getInstance();
const getDashboardContr = GetDashboardContr.getInstance()
const clientTransaction = clientContrTransaction.getInstance();
const AdminTransaction = AdminTransactionContr.getInstance();
const investPlanContr = InvestPlanContr.getInstance();
const adminGetDashBoardContr = AdminGetDashBoardContr.getInstance();
const updateNotificationContr = UpdateNotificationContr.getInstance();
const cryptoWalletContr = CryptoWalletContr.getInstance();
const UserUpdateContr = userUpdateContr.getInstance();
const KycContr = kycContr.getInstance();
const adminKycContr = AdminKycContr.getInstance();
const clientInvestmentContr = ClientInvestmentContr.getInstance();
const adminInvestContr = AdminInvestContr.getInstance();



// client auth section
router.post("/signup", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.SignUp(req, res));
router.post("/login", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.Login(req, res));
router.post("/forgetPassword", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.forgotPassword(req, res));
router.post("/resetPassword", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.resetPassword(req, res));
router.post("/profileUpdate", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => authContr.profileUpdate(req, res));

//FRONT END TOKEN VERIFICATION
router.get("/verify", apiKey.RequireApiKey.bind(apiKey), (req, res) => Authenticate.FrontEndVerify(req, res));

// KYC SECTION 
router.post("/VerifyKyc", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => KycContr.VerifyKyc(req, res));

// client dashboard
router.get("/dashboard", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => getDashboardContr.getDashBoard(req, res))

// Notification Section 
router.put("/markNotificationAsRead", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => updateNotificationContr.UpdateSingleNotif(req, res));
router.put("/markAllNotificationAsRead", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => updateNotificationContr.updateUserAllNotif(req, res))

// User Transaction section
router.post("/Deposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientTransaction.userDeposit(req, res));

router.post("/withdraw", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientTransaction.userWithdrawal(req, res));
// 
// invest plan
router.get("/investPlan", apiKey.RequireApiKey.bind(apiKey), (req, res) => getDashboardContr.getInvestPlan(req, res));
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
// 
router.get("/dashboardAdminUsers", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminGetDashBoardContr.getAdminDashBoardUsers(req, res));
router.post("/dashboardAdminWallets", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminGetDashBoardContr.getAdminDashBoardWallets(req, res));

// Admin Transaction Section
router.get("/Transactions", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.adminGetTransaction(req, res));
router.post("/confirmDeposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.confirmDeposit(req, res));
router.post("/cancleDeposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.cancelDeposit(req, res));
router.post("/confirmWithdraw", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.confirmWithdrawal(req, res));

// ADMIN CRYPTO WALLET SECTION
router.get("/getWallets", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => cryptoWalletContr.getCryptoWallet(req, res));
router.post("/addWallet", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => cryptoWalletContr.createCryptoWallet(req, res));
router.put("/updateWallet", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => cryptoWalletContr.updateCryptoWallet(req, res));
router.delete("/deleteWallet", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => cryptoWalletContr.deleteCryptoWallet(req, res));

// USER UPDATE
router.post("/getAdminUser", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => UserUpdateContr.AdminGetUser(req, res))
router.post("/updateFile", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => UserUpdateContr.AdminUpdateUser(req, res));

// INVESTMENT SECTION 
router.put("/confirmInvest", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminInvestContr.confirmInvestment(req, res));
router.put("/cancelInvest", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminInvestContr.cancelInvestment(req, res));


const CRON_SCHEDULE = "*/2 * * * *"; // Every 2 minutes

interface CronOptions {
    scheduled: boolean;
    timezone: string;
    recoverMissedExecutions: boolean;
}

const cronOptions: CronOptions = {
    scheduled: true,
    timezone: "Africa/Lagos",
    recoverMissedExecutions: false,
};
// INVESTMENT PROCESSING SECTION
schedule(
    CRON_SCHEDULE,
    (): void => {
        try {
            console.log(`Processing ROI at: ${new Date().toISOString()}`);
            adminInvestContr.processDailyROI(undefined as any, undefined as any);
        } catch (error) {
            console.error('Error processing ROI:', error);
        }
    },
    cronOptions
);

export default router;

