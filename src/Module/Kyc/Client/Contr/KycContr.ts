import { Response } from "express";
import { AuthRequest } from "../../../../config/JWTAUth";
import { ErrorHandler } from "../../../../Utili/ZodError/ZodError";
import { KycService } from "../Service/KycService";

export class kycContr {
    private static instance: kycContr;
    private KycService: KycService;

    private constructor() {
        this.KycService = KycService.getInstance();
    }

    public static getInstance(): kycContr {
        if (!kycContr.instance) {
            kycContr.instance = new kycContr();
        }

        return kycContr.instance;
    }

    public async VerifyKyc(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.body.userId;
            if (!userId) {
                res.status(400).json({ message: "user id needed" });
            }

            const userData = {
                userId: userId,
                KycData: req.body
            }
            const result = await this.KycService.VerifyKyc(userData);
            res.status(200).json({
                success: true,
                result,
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