"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminKycContr = void 0;
const AdminKycService_1 = require("../Service/AdminKycService");
const ZodError_1 = require("../../../../Utili/ZodError/ZodError");
class AdminKycContr {
    constructor() {
        this.AdminKycService = AdminKycService_1.AdminKycService.getInstance();
    }
    ;
    static getInstance() {
        if (!AdminKycContr.instance) {
            AdminKycContr.instance = new AdminKycContr();
        }
        return AdminKycContr.instance;
    }
    async ConfirmKyc(req, res) {
        try {
            const userData = {
                userId: req.body.userId,
                KycId: req.body.KycId,
            };
            const result = await this.AdminKycService.ConfirmKyc(userData);
            res.status(200).json({
                success: true,
                data: result,
            });
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
    async CancelKyc(req, res) {
        try {
            const userData = {
                userId: req.body.userId,
                KycId: req.body.KycId,
            };
            const result = await this.AdminKycService.CancelKyc(userData);
            res.status(200).json({
                success: true,
                data: result,
            });
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
exports.AdminKycContr = AdminKycContr;
