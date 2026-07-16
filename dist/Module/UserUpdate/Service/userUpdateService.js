"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userUpdateService = void 0;
const UserSchema_1 = __importDefault(require("../../Auth/Model/UserSchema"));
const WalletSchema_1 = __importDefault(require("../../Wallet/Model/WalletSchema"));
class userUpdateService {
    constructor() {
        this.user = UserSchema_1.default;
        this.wallet = WalletSchema_1.default;
    }
    static getInstance() {
        if (!userUpdateService.instance) {
            userUpdateService.instance = new userUpdateService();
        }
        return userUpdateService.instance;
    }
    async AdminGetUser(userId) {
        try {
            const isExist = await this.user.findById(userId);
            if (!isExist) {
                throw new Error("user not found");
            }
            const wallet = await this.wallet.findOne({ userId: userId });
            if (!wallet) {
                throw new Error("Wallet not found");
            }
            return {
                user: isExist,
                wallet
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to Delete crypto wallet: ${error.message}`);
            }
            throw new Error('Failed to Delete crypto wallet: Unknown error');
        }
    }
    async AdminUpdateUser(userId, updateData) {
        try {
            let results = {};
            let userUpdate = {};
            let walletUpdate = {};
            if (updateData.KycStatus !== undefined)
                userUpdate.KycStatus = updateData.KycStatus;
            if (updateData.softDelete !== undefined)
                userUpdate.softDelete = updateData.softDelete;
            if (Object.keys(userUpdate).length > 0) {
                const updatedUser = await this.user.findByIdAndUpdate(userId, { $set: userUpdate }, { new: true, runValidators: true });
                if (!updatedUser) {
                    throw new Error("User not found");
                }
                results.user = updatedUser;
                console.log("User updated:", userUpdate);
            }
            const walletFields = [
                "balance",
                "pendingInvestment",
                "invBalance",
                "pendingWithdraw",
                "totalDeposits",
                "totalReturn",
                "pending",
                "refBonus",
            ];
            walletFields.forEach((field) => {
                if (updateData[field] !== undefined) {
                    walletUpdate[field] = updateData[field];
                }
            });
            if (Object.keys(walletUpdate).length > 0) {
                const updatedWallet = await this.wallet.findOneAndUpdate({ userId: userId }, { $set: walletUpdate }, {
                    new: true,
                    runValidators: true,
                    upsert: true, // Create wallet if it doesn't exist
                });
                results.wallet = updatedWallet;
                console.log("Wallet updated:", walletUpdate);
            }
            return {
                results,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to Delete crypto wallet: ${error.message}`);
            }
            throw new Error('Failed to Delete crypto wallet: Unknown error');
        }
    }
}
exports.userUpdateService = userUpdateService;
