import InvestmentPlan, { IInvestmentPlan } from "../Model/InvestmentPlanSchema";

export class investPlanService {
    private static instance: investPlanService;
    private investPlan = InvestmentPlan;

    private constructor() { }

    public static getInstance(): investPlanService {
        if (!investPlanService.instance) {
            investPlanService.instance = new investPlanService();
        }

        return investPlanService.instance;
    }

    public async createInvestPan(userData: Partial<IInvestmentPlan>) {
        try {

            const investPlan = await this.investPlan.create(userData);
            return {
                success: true,
                message: "Investment Plan Created Successfully",
                data: {
                    investmentPlan: investPlan,
                },
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }

    public async updateInvestmentPlan(userData: Partial<IInvestmentPlan>) {
        try {
            const { planId, name, minAmount, maxAmount, color, iconName, roi, duration, description, isActive, features } = userData;

            const investmentPlan = await this.investPlan.findOne({ planId: planId });

            if (!investmentPlan) {
                throw new Error("investment Plan Not Found");
            }

            await this.investPlan.findOneAndUpdate(
                { planId: planId },
                {
                    $set: {
                        planId: planId,
                        name: name,
                        minAmount: minAmount,
                        maxAmount: maxAmount,
                        color: color,
                        iconName: iconName,
                        roi: roi,
                        duration: duration,
                        description: description,
                        isActive: isActive,
                        features: features,
                    }
                }
            )

            return {
                success: true,
                message: "investment updated successfully",
                data: {
                    investmentPlan: investmentPlan,
                },
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }

    public async DeleteInvestmentPlan(id: string) {
        try {
            const deletedPlan = await this.investPlan.findByIdAndDelete(id);
            if (!deletedPlan) {
                throw new Error(`Investment plan with ID ${id} not found`);
            }
            return {
                success: true,
                message: "Investment plan deleted successfully",
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
}