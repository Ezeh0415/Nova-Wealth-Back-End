import { Request, Response } from "express";
import { AuthRequest } from "../../../../config/JWTAUth";
import { userDeposit } from "../ZodValidation/userDeposit";
import { ClientTransaction } from "../Service/ClientTransaction";
import { ErrorHandler } from "../../../../Utili/ZodError/ZodError";

export class clientContrTransaction {
    private static instance: clientContrTransaction;
    private TransactionService: ClientTransaction

    private constructor() {
        this.TransactionService = ClientTransaction.getInstance();
    }

    public static getInstance(): clientContrTransaction {
        if (clientContrTransaction.instance) {
            clientContrTransaction.instance = new clientContrTransaction()
        }

        return clientContrTransaction.instance
    };

    public async userDeposit(req: AuthRequest, res: Response): Promise<void> {
        const validateData = userDeposit.parse(req.body)
        const { amount, paymentType } = validateData;

        const userId = req.user.userId;

        const userData = {
            userId: userId,
            amount: amount,
            currency: paymentType,
        };

        try {
            const data = await this.TransactionService.userDeposit(userData);
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