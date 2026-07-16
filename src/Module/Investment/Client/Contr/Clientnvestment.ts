import { Response } from "express";
import { AuthRequest } from "../../../../config/JWTAUth";
import { Invest } from "../../ZodValidation/Invest";
import { ErrorHandler } from "../../../../Utili/ZodError/ZodError";
import { ClientInvestment, IInvest } from "../Service/InvestmentClient";

export class ClientInvestmentContr {
    private static instance: ClientInvestmentContr;
    private ClientInvestment: ClientInvestment;

    private constructor() {
        this.ClientInvestment = ClientInvestment.getInstance();
    };

    public static getInstance(): ClientInvestmentContr {
        if (!ClientInvestmentContr.instance) {
            ClientInvestmentContr.instance = new ClientInvestmentContr();
        }

        return ClientInvestmentContr.instance;
    }

    public async invest(req: AuthRequest, res: Response): Promise<void> {
        try {
            const validateData = Invest.parse(req.body);
            const userId = req.user.userId;

            if (!userId) {
                res
                    .status(400)
                    .json({ message: "Please provide all required fields" });

                return;
            }

            const Data:IInvest = {
                userId:userId,
                amount:validateData.amount,
                investmentType:validateData.investmentType,
            }

            const investment = await this.ClientInvestment.invest(Data)

            res.status(200).json(investment);
            return
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