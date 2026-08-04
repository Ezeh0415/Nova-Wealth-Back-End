"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Mailjet_1 = require("../../../../Middleware/GmailSetup/Mailjet");
const UserSchema_1 = __importDefault(require("../../../Auth/Model/UserSchema"));
const NotificationSchema_1 = require("../../../Notification/Model/NotificationSchema");
const WalletSchema_1 = __importDefault(require("../../../Wallet/Model/WalletSchema"));
const AdminTransction_1 = __importStar(require("../../Model/Admin/AdminTransction"));
const TransactionSchema_1 = __importStar(require("../../Model/Client/TransactionSchema"));
const InvestmentClient_1 = require("../../../Investment/Client/Service/InvestmentClient");
const nanoid_1 = require("nanoid");
class ClientTransaction {
    constructor() {
        this.mailjet = Mailjet_1.MailSender.getInstance();
        this.user = UserSchema_1.default;
        this.wallet = WalletSchema_1.default;
        this.Transaction = TransactionSchema_1.default;
        this.AdminTransaction = AdminTransction_1.default;
        this.Notification = NotificationSchema_1.NotificationModel;
        this.ClientInvestment = InvestmentClient_1.ClientInvestment.getInstance();
    }
    static getInstance() {
        if (!ClientTransaction.instance) {
            ClientTransaction.instance = new ClientTransaction();
        }
        return ClientTransaction.instance;
    }
    async userDeposit(userData) {
        try {
            const { userId, plan_id, amount, currency } = userData;
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            let parsedAmount = amount;
            const isExist = await this.user.findById(userObjectId);
            if (!isExist)
                throw new Error("user isn`t registered");
            const uniqueCode = (0, nanoid_1.nanoid)(16);
            const uniqueId = `${userId}-${uniqueCode}`;
            //  AMOUNT CONVERSION - Convert to smallest unit (kobo/cents)
            const conversionRate = 100; // 1 USD = 100 cents
            const creditedAmountInKobo = Math.round(parsedAmount * conversionRate);
            let wallet = await this.wallet.findOne({ userId: userObjectId });
            if (!wallet) {
                wallet = await this.wallet.create({
                    userId: userId,
                    balance: 0,
                    pending: 0,
                });
            }
            wallet.pending += creditedAmountInKobo;
            await wallet.save();
            const transaction = await this.Transaction.create({
                userId: userObjectId,
                type: TransactionSchema_1.PaymentType.DEPOSIT,
                currency: currency.toUpperCase(),
                requestedAmount: creditedAmountInKobo,
                creditedAmount: 0,
                status: TransactionSchema_1.PaymentStatus.PENDING,
                createdAt: new Date(),
                userEmail: isExist.email,
                userFullName: isExist.fullName,
                uniqueId: uniqueId
            });
            await this.AdminTransaction.create({
                userId: userObjectId,
                fullName: isExist.fullName,
                userName: isExist.userName,
                email: isExist.email,
                type: AdminTransction_1.AdminTransactionType.DEPOSIT,
                creditedAmount: creditedAmountInKobo,
                currency: currency.toUpperCase(),
                status: AdminTransction_1.AdminTransactionStatus.PENDING,
                transactionId: transaction._id,
                plan_id: plan_id,
                uniqueId: uniqueId
            });
            await this.Notification.create({
                user: userObjectId,
                type: NotificationSchema_1.NotificationType.DEPOSIT,
                title: "Your Deposit Request",
                message: `Hello ${isExist.fullName}, your deposit request of ${parsedAmount} ${currency.toUpperCase()} has been received and is pending approval.`,
                data: { amount: parsedAmount, currency: currency.toUpperCase() },
                priority: NotificationSchema_1.NotificationPriority.MEDIUM,
                category: NotificationSchema_1.NotificationType.DEPOSIT,
                actionUrl: `/transactions`,
                icon: NotificationSchema_1.NotificationType.DEPOSIT,
            });
            const userInfo = {
                userId: userObjectId,
                type: TransactionSchema_1.PaymentType.DEPOSIT,
                currency: currency.toUpperCase(),
                requestedAmount: creditedAmountInKobo,
                status: TransactionSchema_1.PaymentStatus.PENDING,
                createdAt: new Date(),
                userEmail: isExist.email,
                userFullName: isExist.fullName,
            };
            await this.mailjet.sendUserDeposit(userInfo.userEmail, userInfo.userId, userInfo.type, userInfo.currency, userInfo.requestedAmount, userInfo.status, userInfo.createdAt, userInfo.userEmail, userInfo.userFullName);
            // NOW PROCESSING INVEST
            const investData = {
                userId: userId,
                amount: parsedAmount,
                investmentType: plan_id,
                uniqueId: uniqueId,
            };
            const result = await this.ClientInvestment.invest(investData);
            return {
                success: true,
                message: "Deposit request submitted successfully",
                data: {
                    transactionId: transaction._id,
                    amount: parsedAmount,
                    currency: currency.toUpperCase(),
                    status: TransactionSchema_1.PaymentStatus.PENDING,
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`deposit failed: ${errorMessage}`);
        }
    }
    async userWithdrawal(userData) {
        console.log(userData);
        try {
            const { userId, amount, currency, walletAddress } = userData;
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            const isExist = await this.user.findById(userObjectId);
            if (!isExist) {
                throw new Error("no account with this user");
            }
            const wallet = await this.wallet.findOne({ userId: userObjectId });
            if (!wallet) {
                throw new Error("wallet not found");
            }
            const conversionRate = 100;
            const creditedAmountInKobo = amount * conversionRate;
            if (wallet.balance < creditedAmountInKobo)
                throw new Error("Insufficient balance");
            // 4. WALLET UPDATE - Deduct from balance, add to pending withdrawals
            wallet.balance -= creditedAmountInKobo;
            wallet.pendingWithdraw += creditedAmountInKobo;
            await wallet.save();
            const Transaction = await this.Transaction.create({
                userId: userObjectId,
                type: TransactionSchema_1.PaymentType.WITHDRAW,
                currency: currency.toUpperCase(),
                requestedAmount: creditedAmountInKobo,
                creditedAmount: 0, // Will be updated on confirmation
                status: TransactionSchema_1.PaymentStatus.PENDING,
                createdAt: new Date(),
                userEmail: isExist.email,
                userFullName: isExist.fullName,
            });
            await this.AdminTransaction.create({
                userId: userObjectId,
                fullName: isExist.fullName,
                userName: isExist.userName,
                email: isExist.email,
                type: AdminTransction_1.AdminTransactionType.WITHDRAW,
                creditedAmount: creditedAmountInKobo,
                currency: currency.toUpperCase(),
                status: AdminTransction_1.AdminTransactionStatus.PENDING,
                walletAddress: walletAddress,
                transactionId: Transaction._id,
            });
            await this.Notification.create({
                user: userObjectId,
                type: NotificationSchema_1.NotificationType.WITHDRAWAL,
                title: "Withdrawal Request Received",
                message: `Hello ${isExist.fullName}, your withdrawal request of ${amount} ${currency.toUpperCase()} has been received and is pending approval.`,
                data: { amount: amount, currency: currency.toUpperCase() },
                priority: NotificationSchema_1.NotificationPriority.MEDIUM,
                category: NotificationSchema_1.NotificationType.WITHDRAWAL,
                actionUrl: `/withdraw`,
                icon: NotificationSchema_1.NotificationType.WITHDRAWAL,
            });
            const userInfo = {
                userId: userObjectId,
                type: TransactionSchema_1.PaymentType.DEPOSIT,
                currency: currency.toUpperCase(),
                requestedAmount: creditedAmountInKobo,
                status: TransactionSchema_1.PaymentStatus.PENDING,
                createdAt: new Date(),
                userEmail: isExist.email,
                userFullName: isExist.fullName,
            };
            await this.mailjet.sendUserWithdrawal(userInfo.userEmail, userInfo.userId, userInfo.type, userInfo.currency, userInfo.requestedAmount, userInfo.status, userInfo.createdAt, userInfo.userEmail, userInfo.userFullName);
            return {
                success: true,
                message: "withdraw request submitted successfully",
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`deposit failed: ${errorMessage}`);
        }
    }
}
exports.ClientTransaction = ClientTransaction;
