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
            const validateData = CreateInvestPlan.parse(req.body);

            const userData = {
                planId: validateData.planId,
                name: validateData.name,
                minAmount: validateData.minAmount,
                maxAmount: validateData.maxAmount,
                color: validateData.color,
                iconName: validateData.iconName,
                roi: validateData.roi,
                duration: validateData.duration,
                description: validateData.description,
                isActive: validateData.isActive,
                features: validateData.features,
                order: validateData.order,
            }

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
}