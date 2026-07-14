"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoWalletContr = void 0;
const ZodError_1 = require("../../../Utili/ZodError/ZodError");
const CryptoWallet_1 = require("../Service/CryptoWallet");
const CreateCryptoWallet_1 = require("../ZodValidation/CreateCryptoWallet");
class CryptoWalletContr {
    constructor() {
        this.CryptoWalletService = CryptoWallet_1.CryptoWalletService.getInstance();
    }
    static getInstance() {
        if (!CryptoWalletContr.instance) {
            CryptoWalletContr.instance = new CryptoWalletContr();
        }
        return CryptoWalletContr.instance;
    }
    async getCryptoWallet(req, res) {
        try {
            const result = await this.CryptoWalletService.getCryptoWallets();
            res.status(200).json({
                status: "success",
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
    async createCryptoWallet(req, res) {
        try {
            const userData = await CreateCryptoWallet_1.createCryptoWallet.parse(req.body);
            await this.CryptoWalletService.createCryptoWallet(userData);
            res.status(200).json({
                success: true,
                message: "Wallet created successfully",
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
    async updateCryptoWallet(req, res) {
        try {
            const userData = await CreateCryptoWallet_1.updateCryptoWallet.parse(req.body);
            await this.CryptoWalletService.updateCryptoWallet(userData);
            res.status(200).json({
                success: true,
                message: "Wallet updated successfully",
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
    async deleteCryptoWallet(req, res) {
        try {
            const userData = await CreateCryptoWallet_1.deleteCryptoWallet.parse(req.body);
            await this.CryptoWalletService.DeleteCryptoWallet(userData);
            res.status(200).json({
                success: true,
                message: "Wallet deleted successfully",
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
exports.CryptoWalletContr = CryptoWalletContr;
