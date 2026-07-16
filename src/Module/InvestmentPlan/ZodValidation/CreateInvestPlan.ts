import z from "zod";
import { PlanIconName } from "../Model/InvestmentPlanSchema";

export const CreateInvestPlan = z.object({
    planId: z.string(),
    name: z.string(),
    minAmount: z.number(),
    maxAmount: z.number(),
    roi: z.number(),
    duration: z.number(),
    color: z.string(),
    iconName: z.nativeEnum(PlanIconName),
    description: z.string(),
    features: z.array(z.string()).min(1, "At least one feature is required").max(10, "Maximum 10 features allowed"),
    isActive: z.boolean(),
    order: z.number().optional(),
})