"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminInvestContr = void 0;
const ZodError_1 = require("../../../../Utili/ZodError/ZodError");
const AdminInvestment_1 = require("../Service/AdminInvestment");
class AdminInvestContr {
    constructor() {
        this.AdminInvestmentService = AdminInvestment_1.AdminInvestmentService.getInstance();
    }
    ;
    static getInstance() {
        if (!AdminInvestContr.instance) {
            AdminInvestContr.instance = new AdminInvestContr();
        }
        return AdminInvestContr.instance;
    }
    async confirmInvestment(req, res) {
        try {
            const { investmentId } = req.body;
            const investConfirm = await this.AdminInvestmentService.confirmInvestment(investmentId);
            res.status(200).json(investConfirm);
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
    async cancelInvestment(req, res) {
        try {
            const { investmentId } = req.body;
            const investConfirm = await this.AdminInvestmentService.cancelInvestment(investmentId);
            res.status(200).json(investConfirm);
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
    async processDailyROI(req, res) {
        await this.AdminInvestmentService.processDailyROI();
    }
}
exports.AdminInvestContr = AdminInvestContr;
