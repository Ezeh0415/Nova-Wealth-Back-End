import { Request, Response } from "express";
import { ErrorHandler } from "../../../../Utili/ZodError/ZodError";
import { SignUp } from "../ZodValidation/SignUp";
import { AdminAuth } from "../Service/AdminAuth";
import { Login } from "../ZodValidation/Login";

export class AdminAuthContr {
    private static instance: AdminAuthContr;
    private AdminAuth: AdminAuth;

    private constructor() {
        this.AdminAuth = AdminAuth.getInstance()
    };

    public static getInstance(): AdminAuthContr {
        if (!AdminAuthContr.instance) {
            AdminAuthContr.instance = new AdminAuthContr();
        }

        return AdminAuthContr.instance
    }

    public async AdminSignUp(req: Request, res: Response): Promise<void> {
        try {

            const validateData = await SignUp.parse(req.body);

            const result = await this.AdminAuth.adminSignup(validateData);

            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: result.safeUser,
                accessToken: result.token,
            })

        } catch (error) {
            if (ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);

            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            })

            return;
        }
    }

    public async AdminLogin(req: Request, res: Response): Promise<void> {
        try {
            const validateData = await Login.parse(req.body);

            const result = await this.AdminAuth.adminLogin(validateData);

            res.status(200).json({
                message: "Login successful",
                data: result.safeUser,
                accessToken: result.accessToken,
            });
        } catch (error) {
            if (ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);

            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            })

            return;
        }
    }
}