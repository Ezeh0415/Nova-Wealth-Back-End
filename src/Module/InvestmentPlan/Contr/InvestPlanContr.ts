import { Response } from "express";
import { AuthRequest } from "../../../config/JWTAUth";
import { ErrorHandler } from "../../../Utili/ZodError/ZodError";
import { CreateInvestPlan } from "../ZodValidation/CreateInvestPlan";
import { investPlanService } from "../Service/InvestmentPlan";

export class InvestPlanContr {
    private static instance: InvestPlanContr;
    private investPlanService: investPlanService;

    private constructor() {
        this.investPlanService = investPlanService.getInstance();
    };

    public static getInstance(): InvestPlanContr {
        if (!InvestPlanContr.instance) {
            InvestPlanContr.instance = new InvestPlanContr();
        }

        return InvestPlanContr.instance;
    }

    public async CreateInvestPlan(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userData = CreateInvestPlan.parse(req.body);

            const newInvestmentPlan = await this.investPlanService.createInvestPan(userData);

            res.status(200).json(newInvestmentPlan);

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

    public async updateInvestPlan(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userData = CreateInvestPlan.parse(req.body);
            const updateInvestPlan = await this.investPlanService.updateInvestmentPlan(id as string, userData);
            res.status(200).json(updateInvestPlan);
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

    public async DeleteInvestPlan(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const deleteInvestPlan = await this.investPlanService.DeleteInvestmentPlan(id as string);
            res.status(200).json(deleteInvestPlan);
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