"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthContr = void 0;
const ZodError_1 = require("../../../../Utili/ZodError/ZodError");
const SignUp_1 = require("../ZodValidation/SignUp");
const AdminAuth_1 = require("../Service/AdminAuth");
const Login_1 = require("../ZodValidation/Login");
class AdminAuthContr {
    constructor() {
        this.AdminAuth = AdminAuth_1.AdminAuth.getInstance();
    }
    ;
    static getInstance() {
        if (!AdminAuthContr.instance) {
            AdminAuthContr.instance = new AdminAuthContr();
        }
        return AdminAuthContr.instance;
    }
    async AdminSignUp(req, res) {
        try {
            const validateData = await SignUp_1.SignUp.parse(req.body);
            const result = await this.AdminAuth.adminSignup(validateData);
            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: result.safeUser,
                accessToken: result.token,
            });
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
    async AdminLogin(req, res) {
        try {
            const validateData = await Login_1.Login.parse(req.body);
            const result = await this.AdminAuth.adminLogin(validateData);
            res.status(200).json({
                message: "Login successful",
                data: result.safeUser,
                accessToken: result.accessToken,
            });
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
}
exports.AdminAuthContr = AdminAuthContr;
