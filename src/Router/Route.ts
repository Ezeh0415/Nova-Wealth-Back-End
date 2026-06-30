import { Router } from "express";
import express from "express";
import { AuthContr } from "../Module/Auth/Client/Contr/Auth";
import { AdminAuthContr } from "../Module/Auth/Admin/Contr/Auth";

const router = Router();
const authContr = AuthContr.getInstance();
const adminAuthContr = AdminAuthContr.getInstance();

// client auth section
router.post("/signup", (req, res) => authContr.SignUp(req, res));
router.post("/login", (req, res) => authContr.Login(req, res));
router.post("/forgetPassword", (req, res) => authContr.forgotPassword(req, res));
router.post("/resetPassword", (req, res) => authContr.resetPassword(req, res));

// Admin Auth Section
router.post("/AdminSignup", (req, res) => adminAuthContr.AdminSignUp(req, res));
router.post("/AdminLogin", (req, res) => adminAuthContr.AdminLogin(req, res));

export default router;