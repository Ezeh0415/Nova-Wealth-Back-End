import { Router } from "express";
import express from "express";
import { AuthContr } from "../Module/Auth/Client/Contr/Auth";

const router = Router();
const authContr = AuthContr.getInstance();

// client auth section
router.post("/signup", (req, res) => authContr.SignUp(req, res));
router.post("/login", (req, res) => authContr.Login(req, res));
router.post("/forgetPassword", (req, res) => authContr.forgotPassword(req, res));
router.post("/resetPassword", (req, res) => authContr.resetPassword(req, res));

export default router;