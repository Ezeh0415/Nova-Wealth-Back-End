import express from "express";
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

// client auth section
router.post("/signup", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.SignUp(req, res));
router.post("/login", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.Login(req, res));
router.post("/forgetPassword", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.forgotPassword(req, res));
router.post("/resetPassword", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.resetPassword(req, res));

// client dashboard
router.get("/dashboard", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => getDashboardContr.getDashBoard(req, res))

// Notification Section 
router.put("/markNotificationAsRead", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => updateNotificationContr.UpdateSingleNotif(req, res));
router.put("/markAllNotificationAsRead", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => updateNotificationContr.updateUserAllNotif(req, res))

// User Transaction section
router.post("/payment", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientTransaction.userDeposit(req, res));
router.post("/withdraw", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientTransaction.userWithdrawal(req, res));

// invest plan
router.post("investPlan", apiKey.RequireApiKey.bind(apiKey), (req, res) => getDashboardContr.getInvestPlan(req, res));
router.post("/createPlan", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => investPlanContr.CreateInvestPlan(req, res));
router.put("/updatePlan/:id", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => investPlanContr.updateInvestPlan(req, res));
router.delete("/deletePlan/:id", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => investPlanContr.DeleteInvestPlan(req, res));



// 
//  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER  ADMIN SECTION ROUTER   ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER
// ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER   ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  ADMIN SECTION ROUTER  
// 

// Admin Auth Section
router.post("/AdminSignup", apiKey.RequireApiKey.bind(apiKey), (req, res) => adminAuthContr.AdminSignUp(req, res));
router.post("/AdminLogin", apiKey.RequireApiKey.bind(apiKey), (req, res) => adminAuthContr.AdminLogin(req, res));

// AdminDashBoard Section
router.post("/dashboardAdminUsers", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminGetDashBoardContr.getAdminDashBoardUsers(req, res));
router.post("/dashboardAdminWallets", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => adminGetDashBoardContr.getAdminDashBoardWallets(req, res));

// Admin Transaction Section
router.post("/Transactions", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.adminGetTransaction(req, res));
router.post("/confirmDeposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.confirmDeposit(req, res));
router.post("/cancleDeposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.cancelDeposit(req, res));
router.post("/confirmWithdraw", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.confirmWithdrawal(req, res));


export default router;

