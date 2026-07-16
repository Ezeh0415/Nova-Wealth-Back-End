"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoWalletService = void 0;
const CryptoSchema_1 = __importDefault(require("../Model/CryptoSchema"));
class CryptoWalletService {
    constructor() {
        this.CryptoWallet = CryptoSchema_1.default;
    }
    static getInstance() {
        if (!CryptoWalletService.instance) {
            CryptoWalletService.instance = new CryptoWalletService();
        }
        return CryptoWalletService.instance;
    }
    async getCryptoWallets() {
        try {
            const cryptoWallet = await this.CryptoWallet.find();
            return cryptoWallet;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to Get crypto wallets: ${error.message}`);
            }
            throw new Error('Failed to Get crypto wallets: Unknown error');
        }
    }
    async createCryptoWallet(userData) {
        try {
            const cryptoWallet = new this.CryptoWallet({
                cryptoName: userData.cryptoName.toUpperCase(), // Store in uppercase for consistency
                cryptoAddress: userData.cryptoAddress,
            });
            await cryptoWallet.save();
            return cryptoWallet;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to add crypto wallet: ${error.message}`);
            }
            throw new Error('Failed to Add crypto wallet: Unknown error');
        }
    }
    async updateCryptoWallet(userData) {
        try {
            const cryptoWallet = await this.CryptoWallet.findById(userData.userId);
            if (!cryptoWallet) {
                throw new Error("cryptoWallet Not Found");
            }
            const updated = await this.CryptoWallet.findByIdAndUpdate(userData.userId, {
                $set: {
                    cryptoAddress: userData.cryptoAddress
                }
            }, { new: true });
            return updated;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to Update crypto wallet: ${error.message}`);
            }
            throw new Error('Failed to Update crypto wallet: Unknown error');
        }
    }
    async DeleteCryptoWallet(userData) {
        try {
            const cryptoWallet = await this.CryptoWallet.findByIdAndDelete(userData.userId);
            if (!CryptoSchema_1.default) {
                throw new Error("CryptoWallet not found");
            }
            return cryptoWallet;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to Delete crypto wallet: ${error.message}`);
            }
            throw new Error('Failed to Delete crypto wallet: Unknown error');
        }
    }
}
exports.CryptoWalletService = CryptoWalletService;
