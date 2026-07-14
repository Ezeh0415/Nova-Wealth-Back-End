import { AuthRequest } from "../../../../config/JWTAUth";
import { Response } from "express";
import { ErrorHandler } from "../../../../Utili/ZodError/ZodError";
import { AdminInvestmentService } from "../Service/AdminInvestment";

export class AdminInvestContr {
    private static instance: AdminInvestContr;
    private AdminInvestmentService: AdminInvestmentService;

    private constructor() {
        this.AdminInvestmentService = AdminInvestmentService.getInstance();
    };

    public static getInstance(): AdminInvestContr {
        if (!AdminInvestContr.instance) {
            AdminInvestContr.instance = new AdminInvestContr();
        }

        return AdminInvestContr.instance;
    }

    public async confirmInvestment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { investmentId } = req.body;
            const investConfirm =
                await this.AdminInvestmentService.confirmInvestment(investmentId);

            res.status(200).json(investConfirm);

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

    public async cancelInvestment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { investmentId } = req.body;
            const investConfirm =
                await this.AdminInvestmentService.cancelInvestment(investmentId);

            res.status(200).json(investConfirm);

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

    public async processDailyROI(req: AuthRequest, res: Response) {
        await this.AdminInvestmentService.processDailyROI();
    }
}