"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kycContr = void 0;
const ZodError_1 = require("../../../../Utili/ZodError/ZodError");
const KycService_1 = require("../Service/KycService");
class kycContr {
    constructor() {
        this.KycService = KycService_1.KycService.getInstance();
    }
    static getInstance() {
        if (!kycContr.instance) {
            kycContr.instance = new kycContr();
        }
        return kycContr.instance;
    }
    async VerifyKyc(req, res) {
        try {
            const userId = req.body.userId;
            if (!userId) {
                res.status(400).json({ message: "user id needed" });
            }
            const userData = {
                userId: userId,
                KycData: req.body
            };
            const result = await this.KycService.VerifyKyc(userData);
            res.status(200).json({
                success: true,
                result,
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
exports.kycContr = kycContr;
