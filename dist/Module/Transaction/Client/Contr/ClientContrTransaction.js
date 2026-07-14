"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientContrTransaction = void 0;
const userDeposit_1 = require("../ZodValidation/userDeposit");
const ClientTransaction_1 = require("../Service/ClientTransaction");
const ZodError_1 = require("../../../../Utili/ZodError/ZodError");
const userWithdrawal_1 = require("../ZodValidation/userWithdrawal");
class clientContrTransaction {
    constructor() {
        this.TransactionService = ClientTransaction_1.ClientTransaction.getInstance();
    }
    static getInstance() {
        if (clientContrTransaction.instance) {
            clientContrTransaction.instance = new clientContrTransaction();
        }
        return clientContrTransaction.instance;
    }
    ;
    async userDeposit(req, res) {
        try {
            const validateData = userDeposit_1.userDeposit.parse(req.body);
            const { amount, paymentType } = validateData;
            const userId = req.user.userId;
            const userData = {
                userId: userId,
                amount: amount,
                currency: paymentType,
            };
            const data = await this.TransactionService.userDeposit(userData);
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
    async userWithdrawal(req, res) {
        try {
            const validateData = userWithdrawal_1.userWithdrawal.parse(req.body);
            const { amount, paymentType, walletAddress } = validateData;
            const currency = paymentType;
            const userId = req.user.userId;
            const userData = {
                userId: userId,
                amount: amount,
                currency: currency,
                walletAddress: walletAddress,
            };
            const result = await this.TransactionService.userWithdrawal(userData);
            res.status(200).json(result);
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
exports.clientContrTransaction = clientContrTransaction;
