"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestPlanContr = void 0;
const ZodError_1 = require("../../../Utili/ZodError/ZodError");
const CreateInvestPlan_1 = require("../ZodValidation/CreateInvestPlan");
const InvestmentPlan_1 = require("../Service/InvestmentPlan");
class InvestPlanContr {
    constructor() {
        this.investPlanService = InvestmentPlan_1.investPlanService.getInstance();
    }
    ;
    static getInstance() {
        if (!InvestPlanContr.instance) {
            InvestPlanContr.instance = new InvestPlanContr();
        }
        return InvestPlanContr.instance;
    }
    async CreateInvestPlan(req, res) {
        try {
            const userData = CreateInvestPlan_1.CreateInvestPlan.parse(req.body);
            const newInvestmentPlan = await this.investPlanService.createInvestPan(userData);
            res.status(200).json(newInvestmentPlan);
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
    async updateInvestPlan(req, res) {
        try {
            const userData = CreateInvestPlan_1.CreateInvestPlan.parse(req.body);
            const updateInvestPlan = await this.investPlanService.updateInvestmentPlan(userData);
            res.status(200).json(updateInvestPlan);
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
    async DeleteInvestPlan(req, res) {
        try {
            const id = req.body.id;
            const deleteInvestPlan = await this.investPlanService.DeleteInvestmentPlan(id);
            res.status(200).json(deleteInvestPlan);
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
}
exports.InvestPlanContr = InvestPlanContr;
