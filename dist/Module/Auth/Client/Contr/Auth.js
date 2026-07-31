"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthContr = void 0;
const Auth_1 = require("../Service/Auth");
const Signup_1 = require("../ZodValidation/Signup");
const ZodError_1 = require("../../../../Utili/ZodError/ZodError");
const Login_1 = require("../ZodValidation/Login");
const ForgotPassword_1 = require("../ZodValidation/ForgotPassword");
const ResetPassword_1 = require("../ZodValidation/ResetPassword");
const profileUpdate_1 = require("../ZodValidation/profileUpdate");
class AuthContr {
    constructor() {
        this.Authentication = Auth_1.Authentication.getInstance();
    }
    ;
    static getInstance() {
        if (!AuthContr.instance) {
            AuthContr.instance = new AuthContr();
        }
        return AuthContr.instance;
    }
    async SignUp(req, res) {
        try {
            const ipAddress = req.ip;
            const userAgent = req.headers["user-agent"];
            const validateData = await Signup_1.SignUp.parse(req.body);
            const userData = {
                fullName: validateData.fullName,
                userName: validateData.userName,
                email: validateData.email,
                password: validateData.password,
                ipAddress: ipAddress,
                userAgent: userAgent,
            };
            const result = await this.Authentication.SignUp(userData);
            res.status(201).json({
                success: true,
                message: "user created successfully",
                result
            });
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
    async Login(req, res) {
        try {
            const validateData = await Login_1.Login.parse(req.body);
            const result = await this.Authentication.Login(validateData);
            res.status(200).json({
                message: "Login successful",
                data: result.safeUser,
                accessToken: result.accessToken,
                refreshToken: result.accessToken,
            });
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: errorMessage,
                error: errorMessage,
            });
            return;
        }
    }
    async forgotPassword(req, res) {
        try {
            const ipAddress = req.ip;
            const userAgent = req.headers["user-agent"];
            const validateEmail = await ForgotPassword_1.forgotPassword.parse(req.body);
            const userData = {
                email: validateEmail.email,
                ipAddress: ipAddress,
                userAgent: userAgent,
            };
            const result = await this.Authentication.forgotPassword(userData);
            res.status(200).json({ message: result });
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
    async resetPassword(req, res) {
        try {
            const validateData = await ResetPassword_1.resetPassword.parse(req.body);
            const result = await this.Authentication.resetPassword(validateData.token, validateData.password);
            res.status(200).json({ message: result });
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
    async profileUpdate(req, res) {
        try {
            const validateData = await profileUpdate_1.profileUpdate.parse(req.body);
            const userId = req.user.userId;
            const userData = {
                userId: userId,
                fullName: validateData.fullName,
                email: validateData.email,
                currentPassword: validateData.currentPassword,
                newPassword: validateData.newPassword,
                bitcoin: validateData.bitcoin,
                usdt: validateData.usdt,
                ethereum: validateData.ethereum,
                tron: validateData.tron,
            };
            const response = await this.Authentication.profileUpdate(userData);
            res.status(200).json(response);
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: errorMessage,
                error: errorMessage,
            });
            return;
        }
    }
}
exports.AuthContr = AuthContr;
