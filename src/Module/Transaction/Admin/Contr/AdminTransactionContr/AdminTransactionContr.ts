import { Response } from "express";
import { AuthRequest } from "../../../../../config/JWTAUth";
import { GetTransaction } from "../../ZodValidation/AdminTransaction";
import { ErrorHandler } from "../../../../../Utili/ZodError/ZodError";
import { AdminTransction } from "../../Service/AdminTransacrion";
import { confirmDeposit } from "../../ZodValidation/confirmDeposit";

export class AdminTransactionContr {
    private static instance: AdminTransactionContr
    private AdminTransction: AdminTransction;

    private constructor() {
        this.AdminTransction = AdminTransction.getInstance();
    }

    public static getInstance(): AdminTransactionContr {
        if (!AdminTransactionContr.instance) {
            AdminTransactionContr.instance = new AdminTransactionContr();
        }

        return AdminTransactionContr.instance
    }

    public async adminGetTransaction(req: AuthRequest, res: Response): Promise<void> {
        try {
            const validateData = GetTransaction.parse(req.body);
            const { page, limit } = validateData;
            const data = await this.AdminTransction.AdminGetTransaction(page, limit);
            res.status(200).json(data);
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

    public async confirmDeposit(req: AuthRequest, res: Response): Promise<void> {
        try {
            const validateData = confirmDeposit.parse(req.body);
            const { userId, transactionId } = validateData;
            const userData = { userId: userId, transactionId: transactionId }
            const data = await this.AdminTransction.confirmDeposit(userData);

            res.status(200).json(data);
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

    public async cancelDeposit(req: AuthRequest, res: Response): Promise<void> {
        try {
            const validateData = confirmDeposit.parse(req.body);
            const { userId, transactionId } = validateData;
            const userData = { userId: userId, transactionId: transactionId }
            const data = await this.AdminTransction.cancelDeposit(userData);

            res.status(200).json(data);
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

    public async confirmWithdrawal(req: AuthRequest, res: Response): Promise<void> {
        try {
            const validateData = confirmDeposit.parse(req.body);
            const { userId, transactionId } = validateData;
            const userData = { userId: userId, transactionId: transactionId }
            const data = await this.AdminTransction.confirmWithdrawal(userData);

            res.status(200).json(data);
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

    public async cancelWithdrawal(req: AuthRequest, res: Response): Promise<void> {
        try {
            const validateData = confirmDeposit.parse(req.body);
            const { userId, transactionId } = validateData;
            const userData = { userId: userId, transactionId: transactionId }
            const data = await this.AdminTransction.CancelWithdrawal(userData);

            res.status(200).json(data);
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