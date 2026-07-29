import { Request, Response } from "express";
import { Authentication, ProfileUpdate } from "../Service/Auth";
import { SignUp } from "../ZodValidation/Signup";
import { ErrorHandler } from "../../../../Utili/ZodError/ZodError";
import { Login } from "../ZodValidation/Login";
import { forgotPassword } from "../ZodValidation/ForgotPassword";
import { resetPassword } from "../ZodValidation/ResetPassword";
import { AuthRequest } from "../../../../config/JWTAUth";
import { profileUpdate } from "../ZodValidation/profileUpdate";

export class AuthContr {
    private static instance: AuthContr;
    private Authentication: Authentication;


    private constructor() {
        this.Authentication = Authentication.getInstance();
    };

    public static getInstance(): AuthContr {
        if (!AuthContr.instance) {
            AuthContr.instance = new AuthContr();
        }
        return AuthContr.instance;
    }

    async SignUp(req: Request, res: Response): Promise<void> {
        try {
            const ipAddress = req.ip;
            const userAgent = req.headers["user-agent"];
            const validateData = await SignUp.parse(req.body);

            const userData = {
                fullName: validateData.fullName,
                userName: validateData.userName,
                email: validateData.email,
                password: validateData.password,
                bitcoin: validateData.bitcoin,
                usdt: validateData.usdt,
                ipAddress: ipAddress,
                userAgent: userAgent,
            }

            const result = await this.Authentication.SignUp(userData);

            res.status(201).json({
                success: true,
                message: "user created successfully",
                result
            })

            return;
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

    async Login(req: Request, res: Response): Promise<void> {
        try {
            const validateData = await Login.parse(req.body);

            const result = await this.Authentication.Login(validateData)

            res.status(200).json({
                message: "Login successful",
                data: result.safeUser,
                accessToken: result.accessToken,
                refreshToken: result.accessToken,
            });

        } catch (error) {
            if (ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);

            res.status(500).json({
                success: false,
                message: errorMessage,
                error: errorMessage,
            })

            return;
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const ipAddress = req.ip;
            const userAgent = req.headers["user-agent"];
            const validateEmail = await forgotPassword.parse(req.body);

            const userData = {
                email: validateEmail.email,
                ipAddress: ipAddress,
                userAgent: userAgent,
            }

            const result = await this.Authentication.forgotPassword(userData);

            res.status(200).json({ message: result });

            return;

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

    async resetPassword(req: Request, res: Response) {
        try {
            const validateData = await resetPassword.parse(req.body);

            const result = await this.Authentication.resetPassword(validateData.token, validateData.password);

            res.status(200).json({ message: result });

            return;
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

    async profileUpdate(req: AuthRequest, res: Response): Promise<void> {
        try {
            const validateData = await profileUpdate.parse(req.body);
            const userId = req.user.userId;

            const userData: ProfileUpdate = {
                userId: userId as string,
                fullName: validateData.fullName,
                email: validateData.email,
                currentPassword: validateData.currentPassword,
                newPassword: validateData.newPassword,
                bitcoin: validateData.bitcoin,
                usdt: validateData.usdt,
                ethereum: validateData.ethereum,
                tron: validateData.tron,
            }

            const response = await this.Authentication.profileUpdate(userData)

            res.status(200).json(response);
            return;
        } catch (error) {
            if (ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);

            res.status(500).json({
                success: false,
                message: errorMessage,
                error: errorMessage,
            })

            return;
        }
    }


}