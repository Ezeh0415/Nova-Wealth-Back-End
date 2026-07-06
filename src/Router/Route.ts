import express from "express";
import { Router } from "express";
import { AuthContr } from "../Module/Auth/Client/Contr/Auth";
import { AdminAuthContr } from "../Module/Auth/Admin/Contr/Auth";
import { clientContrTransaction } from "../Module/Transaction/Client/Contr/ClientContrTransaction";
import { AdminTransactionContr } from "../Module/Transaction/Admin/Contr/AdminTransactionContr/AdminTransactionContr";

const router = Router();
const authContr = AuthContr.getInstance();
const adminAuthContr = AdminAuthContr.getInstance();
const clientTransaction = clientContrTransaction.getInstance();
const AdminTransaction = AdminTransactionContr.getInstance();

// client auth section
router.post("/signup", (req, res) => authContr.SignUp(req, res));
router.post("/login", (req, res) => authContr.Login(req, res));
router.post("/forgetPassword", (req, res) => authContr.forgotPassword(req, res));
router.post("/resetPassword", (req, res) => authContr.resetPassword(req, res));

// Admin Auth Section
router.post("/AdminSignup", (req, res) => adminAuthContr.AdminSignUp(req, res));
router.post("/AdminLogin", (req, res) => adminAuthContr.AdminLogin(req, res));

// User Transaction section
router.post("/payment", (req, res) => clientTransaction.userDeposit(req, res));
router.post("/withdraw", (req, res) => clientTransaction.userWithdrawal(req, res));

// Admin Transaction Section
router.post("/confirmDeposit", (req, res) => AdminTransaction.confirmDeposit(req, res));
router.post("/cancleDeposit", (req, res) => AdminTransaction.cancelDeposit(req, res));
router.post("/confirmWithdraw", (req, res) => AdminTransaction.confirmWithdrawal(req, res));

export default router;