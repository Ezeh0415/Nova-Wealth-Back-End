"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminTransactionContr = void 0;
const AdminTransaction_1 = require("../../ZodValidation/AdminTransaction");
const ZodError_1 = require("../../../../../Utili/ZodError/ZodError");
const AdminTransacrion_1 = require("../../Service/AdminTransacrion");
const confirmDeposit_1 = require("../../ZodValidation/confirmDeposit");
class AdminTransactionContr {
    constructor() {
        this.AdminTransction = AdminTransacrion_1.AdminTransction.getInstance();
    }
    static getInstance() {
        if (!AdminTransactionContr.instance) {
            AdminTransactionContr.instance = new AdminTransactionContr();
        }
        return AdminTransactionContr.instance;
    }
    async adminGetTransaction(req, res) {
        try {
            const validateData = AdminTransaction_1.GetTransaction.parse(req.query);
            const { page, limit } = validateData;
            const data = await this.AdminTransction.AdminGetTransaction(page, limit);
            res.status(200).json(data);
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
    async confirmDeposit(req, res) {
        try {
            const validateData = confirmDeposit_1.confirmDeposit.parse(req.body);
            const { userId, transactionId } = validateData;
            const userData = { userId: userId, transactionId: transactionId };
            const data = await this.AdminTransction.confirmDeposit(userData);
            res.status(200).json(data);
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
    async cancelDeposit(req, res) {
        try {
            const validateData = confirmDeposit_1.confirmDeposit.parse(req.body);
            const { userId, transactionId } = validateData;
            const userData = { userId: userId, transactionId: transactionId };
            const data = await this.AdminTransction.cancelDeposit(userData);
            res.status(200).json(data);
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
    async confirmWithdrawal(req, res) {
        try {
            const validateData = confirmDeposit_1.confirmDeposit.parse(req.body);
            const { userId, transactionId } = validateData;
            const userData = { userId: userId, transactionId: transactionId };
            const data = await this.AdminTransction.confirmWithdrawal(userData);
            res.status(200).json(data);
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
    async cancelWithdrawal(req, res) {
        try {
            const validateData = confirmDeposit_1.confirmDeposit.parse(req.body);
            const { userId, transactionId } = validateData;
            const userData = { userId: userId, transactionId: transactionId };
            const data = await this.AdminTransction.CancelWithdrawal(userData);
            res.status(200).json(data);
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
exports.AdminTransactionContr = AdminTransactionContr;
