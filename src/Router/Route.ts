import express from "express";
import { Router } from "express";
import { AuthContr } from "../Module/Auth/Client/Contr/Auth";
import { AdminAuthContr } from "../Module/Auth/Admin/Contr/Auth";
import { clientContrTransaction } from "../Module/Transaction/Client/Contr/ClientContrTransaction";
import { AdminTransactionContr } from "../Module/Transaction/Admin/Contr/AdminTransactionContr/AdminTransactionContr";
import { ApiKey } from "../Middleware/ApiKey/ApiKey";
import { GetDashboardContr } from "../Module/DashBoard/Client/Contr/GetDashboardContr";
import { TokenAuth } from "../config/JWTAUth";

const router = Router();
const apiKey = ApiKey.getInstance();
const Authenticate = TokenAuth.getInstance();
const authContr = AuthContr.getInstance();
const adminAuthContr = AdminAuthContr.getInstance();
const getDashboardContr = GetDashboardContr.getInstance()
const clientTransaction = clientContrTransaction.getInstance();
const AdminTransaction = AdminTransactionContr.getInstance();

// client auth section
router.post("/signup", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.SignUp(req, res));
router.post("/login", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.Login(req, res));
router.post("/forgetPassword", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.forgotPassword(req, res));
router.post("/resetPassword", apiKey.RequireApiKey.bind(apiKey), (req, res) => authContr.resetPassword(req, res));

// invest plan
router.post("investPlan", apiKey.RequireApiKey.bind(apiKey), (req, res) => getDashboardContr.getInvestPlan(req, res));

// Admin Auth Section
router.post("/AdminSignup", apiKey.RequireApiKey.bind(apiKey), (req, res) => adminAuthContr.AdminSignUp(req, res));
router.post("/AdminLogin", apiKey.RequireApiKey.bind(apiKey), (req, res) => adminAuthContr.AdminLogin(req, res));

// client dashboard
router.get("/dashboard", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => getDashboardContr.getDashBoard(req, res))

// User Transaction section
router.post("/payment", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientTransaction.userDeposit(req, res));
router.post("/withdraw", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => clientTransaction.userWithdrawal(req, res));

// Admin Transaction Section
router.post("/Transactions", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.adminGetTransaction(req, res));
router.post("/confirmDeposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.confirmDeposit(req, res));
router.post("/cancleDeposit", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.cancelDeposit(req, res));
router.post("/confirmWithdraw", apiKey.RequireApiKey.bind(apiKey), Authenticate.authenticate.bind(Authenticate), (req, res) => AdminTransaction.confirmWithdrawal(req, res));

export default router;