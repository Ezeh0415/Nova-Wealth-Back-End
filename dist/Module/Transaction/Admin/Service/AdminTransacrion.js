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
exports.AdminTransction = void 0;
const Mailjet_1 = require("../../../../Middleware/GmailSetup/Mailjet");
const UserSchema_1 = __importDefault(require("../../../Auth/Model/UserSchema"));
const AdminInvestment_1 = require("../../../Investment/Admin/Service/AdminInvestment");
const NotificationSchema_1 = require("../../../Notification/Model/NotificationSchema");
const WalletSchema_1 = __importDefault(require("../../../Wallet/Model/WalletSchema"));
const AdminTransction_1 = __importStar(require("../../Model/Admin/AdminTransction"));
const TransactionSchema_1 = __importStar(require("../../Model/Client/TransactionSchema"));
class AdminTransction {
    constructor() {
        this.AdminSchema = AdminTransction_1.default;
        this.user = UserSchema_1.default;
        this.wallet = WalletSchema_1.default;
        this.Transaction = TransactionSchema_1.default;
        this.Notification = NotificationSchema_1.NotificationModel;
        this.mailjet = Mailjet_1.MailSender.getInstance();
        this.AdminInvestmentService = AdminInvestment_1.AdminInvestmentService.getInstance();
    }
    static getInstance() {
        if (!AdminTransction.instance) {
            AdminTransction.instance = new AdminTransction();
        }
        return AdminTransction.instance;
    }
    async AdminGetTransaction(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const transactions = await this.AdminSchema.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.AdminSchema.countDocuments();
        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            transactions,
        };
    }
    async confirmDeposit(userData) {
        try {
            const { transactionId } = userData;
            const checkTransaction = await this.AdminSchema.findOne({
                uniqueId: transactionId
            });
            if (!checkTransaction) {
                throw new Error(`Admin transaction not found with transactionId: ${transactionId}`);
            }
            if (checkTransaction.isConfirmed === "true") {
                throw new Error("Transaction already Confirmed");
            }
            const user = await this.user.findOne({ _id: checkTransaction?.userId });
            if (!user) {
                throw new Error(`user not found`);
            }
            let isFirstDeposit = false;
            if (user.hasMadeFirstDeposit) {
                // User already made a deposit - still confirm it, but don't give referral bonus
                console.log("User has already made a deposit - no referral bonus");
            }
            else {
                // THIS IS THE USER'S FIRST DEPOSIT
                isFirstDeposit = true;
                user.hasMadeFirstDeposit = true; // Mark user as having made first deposit
                user.firstDepositAmount = checkTransaction.creditedAmount; // Store the deposit amount
                user.firstDepositDate = new Date(); // Record the date
                await user.save(); // Save updated user
            }
            const wallet = await this.wallet.findOne({ userId: checkTransaction?.userId });
            if (!wallet) {
                throw new Error("wallet not found ");
            }
            let transaction;
            if (!transaction) {
                transaction = await this.Transaction.findOne({ uniqueId: transactionId });
            }
            if (!transaction) {
                throw new Error(`Transaction not found with ID: ${transactionId}. Tried both _id and transactionId fields.`);
            }
            if (checkTransaction.creditedAmount !== transaction.requestedAmount) {
                throw new Error("amount incompatible");
            }
            const creditedAmountInKobo = checkTransaction.creditedAmount;
            // 8. WALLET UPDATE
            wallet.totalDeposits += creditedAmountInKobo;
            await wallet.save();
            // 9. TRANSACTION UPDATE
            transaction.requestedAmount -= checkTransaction.creditedAmount;
            transaction.creditedAmount = checkTransaction.creditedAmount;
            const status = checkTransaction.creditedAmount < transaction.requestedAmount ? "pending" : "completed";
            transaction.status = status;
            await transaction.save();
            // 10. ADMIN TRANSACTION UPDATE
            checkTransaction.status = AdminTransction_1.AdminTransactionStatus.COMPLETED;
            checkTransaction.isConfirmed = AdminTransction_1.AdminTransactionConfirmation.TRUE;
            await checkTransaction.save();
            await this.Notification.create({
                user: checkTransaction?.userId,
                type: NotificationSchema_1.NotificationType.DEPOSIT,
                title: "Deposit Confirmed",
                message: `Your deposit of $${(creditedAmountInKobo / 100).toFixed(2)} has been confirmed.${isFirstDeposit ? " This was your first deposit!" : ""}`,
                category: NotificationSchema_1.NotificationType.DEPOSIT,
            });
            const userEmailInput = {
                userId: checkTransaction?.userId,
                type: transaction.type,
                currency: transaction.currency,
                creditedAmount: checkTransaction.creditedAmount, // $1,250.00
                status: "completed",
                creditedAt: new Date(),
                userEmail: user.email,
                userFullName: user.fullName,
                transactionId: transactionId,
                isFirstDeposit: isFirstDeposit,
            };
            await this.mailjet.confirmDeposit(user.email, userEmailInput.userId, userEmailInput.type, userEmailInput.currency, userEmailInput.creditedAmount, userEmailInput.status, userEmailInput.creditedAt, userEmailInput.userEmail, userEmailInput.userFullName, userEmailInput.transactionId, userEmailInput.isFirstDeposit);
            // ATTACH INVEST COMPLETE HERE
            await this.AdminInvestmentService.confirmInvestment(checkTransaction?.uniqueId);
            return {
                success: true,
                message: "Deposit confirmed successfully",
                wallet,
                transaction,
                isFirstDeposit, // Will show referral bonus result if applicable
            };
        }
        catch (error) {
            console.error("Error in confirmDeposit:", error);
            throw error;
        }
    }
    async confirmWithdrawal(userData) {
        try {
            const { userId, transactionId } = userData;
            // 1. FIND ADMIN TRANSACTION
            const adminTransaction = await this.AdminSchema.findOne({
                transactionId: transactionId,
            });
            if (!adminTransaction)
                throw new Error(`Admin transaction not found with transactionId: ${transactionId}`);
            // 3. FIND USER
            const user = await this.user.findOne({ _id: userId });
            if (!user) {
                throw new Error(`User not found for userId: ${userId}`);
            }
            // 2. DUPLICATE CONFIRMATION CHECK
            if (adminTransaction.isConfirmed === "true")
                throw new Error("Transaction already confirmed");
            // 3. FIND USER WALLET
            const wallet = await this.wallet.findOne({ userId });
            if (!wallet)
                throw new Error("Wallet not found");
            // 4. FIND MAIN TRANSACTION
            const transaction = await this.Transaction.findById(transactionId);
            if (!transaction)
                throw new Error("Transaction not found");
            // 5. AMOUNT CONVERSION - Amount already in kobo
            const creditedAmountInKobo = adminTransaction.creditedAmount;
            // 6. WALLET UPDATE - Update withdrawal totals
            // NOTE: Balance check seems redundant since already deducted on request
            if (wallet.balance < creditedAmountInKobo)
                wallet.totalWithdrawals += creditedAmountInKobo;
            wallet.pendingWithdraw -= creditedAmountInKobo;
            await wallet.save();
            // 7. TRANSACTION UPDATE
            transaction.requestedAmount -= adminTransaction.creditedAmount;
            transaction.creditedAmount = adminTransaction.creditedAmount;
            const status = adminTransaction.creditedAmount < transaction.requestedAmount ? "pending" : "completed";
            transaction.status = status;
            await transaction.save();
            // 8. ADMIN TRANSACTION UPDATE
            adminTransaction.status = AdminTransction_1.AdminTransactionStatus.COMPLETED;
            adminTransaction.isConfirmed = AdminTransction_1.AdminTransactionConfirmation.TRUE;
            await adminTransaction.save();
            await this.Notification.create({
                user: userId,
                type: NotificationSchema_1.NotificationType.DEPOSIT,
                title: "Deposit Confirmed",
                message: `Your Withdrawal of $${(creditedAmountInKobo / 100).toFixed(2)} has been confirmed.`,
            });
            const userEmailInput = {
                userId: userId,
                type: transaction.type,
                currency: transaction.currency,
                creditedAmount: adminTransaction.creditedAmount, // $1,250.00
                status: "completed",
                creditedAt: new Date(),
                userEmail: user.email,
                userFullName: user.fullName,
                transactionId: transactionId,
            };
            await this.mailjet.confirmWithdrawal(user.email, userEmailInput.userId, userEmailInput.type, userEmailInput.currency, userEmailInput.creditedAmount, userEmailInput.status, userEmailInput.creditedAt, userEmailInput.userEmail, userEmailInput.userFullName, userEmailInput.transactionId);
            return {
                success: true,
                message: "withdraw confirmed successfully",
                wallet,
            };
        }
        catch (error) {
            console.error("Error in confirmWithdrawal:", error);
            throw error;
        }
    }
    async cancelDeposit(userData) {
        try {
            const { transactionId } = userData;
            // 1. FIND ADMIN TRANSACTION
            const adminTransaction = await this.AdminSchema.findOne({
                uniqueId: transactionId,
            });
            if (!adminTransaction)
                throw new Error(`Admin transaction not found with transactionId: ${transactionId}`);
            // 2. DUPLICATE CONFIRMATION CHECK
            if (adminTransaction.isConfirmed === "true")
                throw new Error("Transaction already confirmed");
            // 3. FIND MAIN TRANSACTION
            const transaction = await this.Transaction.findOne({ uniqueId: transactionId });
            if (!transaction)
                throw new Error("Transaction not found");
            // 4. FIND USER WALLET
            const wallet = await this.wallet.findOne({ userId: adminTransaction?.userId });
            if (!wallet)
                throw new Error("Wallet not found");
            // 5. TRANSACTION UPDATE - Mark as canceled
            transaction.status = TransactionSchema_1.PaymentStatus.CANCELLED;
            await transaction.save();
            // 7. ADMIN TRANSACTION UPDATE
            adminTransaction.status = AdminTransction_1.AdminTransactionStatus.CANCELLED;
            adminTransaction.isConfirmed = AdminTransction_1.AdminTransactionConfirmation.FALSE;
            await adminTransaction.save();
            // ATTACH INVEST COMPLETE HERE
            await this.AdminInvestmentService.cancelInvestment(adminTransaction?.uniqueId);
            return {
                success: true,
                message: "deposit canceled",
                wallet,
            };
        }
        catch (error) {
            console.error("Error canceling Deposit:", error);
            throw error;
        }
    }
    async CancelWithdrawal(userData) {
        try {
            const { userId, transactionId } = userData;
            // 1. FIND ADMIN TRANSACTION
            const adminTransaction = await this.AdminSchema.findOne({
                transactionId: transactionId,
            });
            if (!adminTransaction)
                throw new Error(`Admin transaction not found with transactionId: ${transactionId}`);
            // 2. DUPLICATE CONFIRMATION CHECK
            if (adminTransaction.isConfirmed === "true")
                throw new Error("Transaction already confirmed");
            // 3. FIND MAIN TRANSACTION
            const transaction = await this.Transaction.findById(transactionId);
            if (!transaction)
                throw new Error("Transaction not found");
            // 4. FIND USER WALLET
            const wallet = await this.wallet.findOne({ userId });
            if (!wallet)
                throw new Error("Wallet not found");
            // 5. TRANSACTION UPDATE - Mark as canceled
            transaction.status = TransactionSchema_1.PaymentStatus.CANCELLED;
            await transaction.save();
            // 6. AMOUNT CONVERSION
            const creditedAmountInKobo = adminTransaction.creditedAmount;
            // 7. WALLET UPDATE - Return funds from pending withdrawal to balance
            wallet.pendingWithdraw -= creditedAmountInKobo;
            await wallet.save();
            // 8. ADMIN TRANSACTION UPDATE
            adminTransaction.isConfirmed = AdminTransction_1.AdminTransactionConfirmation.FALSE;
            await adminTransaction.save();
            return {
                success: true,
                message: "withdrawal cancel successfully",
                wallet,
                transaction,
            };
        }
        catch (error) {
            console.error("Error in cancelWithdrawal:", error);
            throw error;
        }
    }
}
exports.AdminTransction = AdminTransction;
