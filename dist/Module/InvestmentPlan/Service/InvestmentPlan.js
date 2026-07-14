"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.investPlanService = void 0;
const InvestmentPlanSchema_1 = __importDefault(require("../Model/InvestmentPlanSchema"));
class investPlanService {
    constructor() {
        this.investPlan = InvestmentPlanSchema_1.default;
    }
    static getInstance() {
        if (!investPlanService.instance) {
            investPlanService.instance = new investPlanService();
        }
        return investPlanService.instance;
    }
    async createInvestPan(userData) {
        try {
            const investPlan = await this.investPlan.create(userData);
            return {
                success: true,
                message: "Investment Plan Created Successfully",
                data: {
                    investmentPlan: investPlan,
                },
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
    async updateInvestmentPlan(investId, userData) {
        try {
            const { planId, name, minAmount, maxAmount, color, iconName, roi, duration, description, isActive, features } = userData;
            const investmentPlan = await this.investPlan.findById(investId);
            if (!investmentPlan) {
                throw new Error("investment Plan Not Found");
            }
            await this.investPlan.findByIdAndUpdate(investId, {
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
            });
            return {
                success: true,
                message: "investment updated successfully",
                data: {
                    investmentPlan: investmentPlan,
                },
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
    async DeleteInvestmentPlan(id) {
        try {
            const deletedPlan = await this.investPlan.findByIdAndDelete(id);
            if (!deletedPlan) {
                throw new Error(`Investment plan with ID ${id} not found`);
            }
            return {
                success: true,
                message: "Investment plan deleted successfully",
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
}
exports.investPlanService = investPlanService;
