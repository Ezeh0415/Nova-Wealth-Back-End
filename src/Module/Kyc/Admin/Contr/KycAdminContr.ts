import { Response } from "express";
import { AuthRequest } from "../../../../config/JWTAUth";
import { AdminKycService } from "../Service/AdminKycService";
import { ErrorHandler } from "../../../../Utili/ZodError/ZodError";

export class AdminKycContr {
    private static instance: AdminKycContr;
    private AdminKycService: AdminKycService;

    private constructor() {
        this.AdminKycService = AdminKycService.getInstance();
    };

    public static getInstance(): AdminKycContr {
        if (!AdminKycContr.instance) {
            AdminKycContr.instance = new AdminKycContr();
        }

        return AdminKycContr.instance;
    }

    public async ConfirmKyc(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userData = {
                userId: req.body.userId,
                KycId: req.body.KycId,
            }

            const result = await this.AdminKycService.ConfirmKyc(userData);

            res.status(200).json({
                success: true,
                data: result,
            });

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

    public async CancelKyc(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userData = {
                userId: req.body.userId,
                KycId: req.body.KycId,
            }

            const result = await this.AdminKycService.CancelKyc(userData);

            res.status(200).json({
                success: true,
                data: result,
            });

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
}