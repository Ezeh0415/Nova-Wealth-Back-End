import mongoose from "mongoose";
import { MailSender } from "../../../Middleware/GmailSetup/Mailjet";
import User from "../../Auth/Model/UserSchema";
import { NotificationModel, NotificationPriority, NotificationType } from "../../Notification/NotificationSchema";
import Wallet from "../../Wallet/WalletSchema";
import AdminTransaction, { AdminTransactionStatus, AdminTransactionType } from "../Model/Admin/AdminTransction";
import TransactionModel, {  PaymentStatus, PaymentType } from "../Model/Client/TransactionSchema";

interface IUserDeposit {
    userId: string;
    amount: number;
    currency: string
}
interface IUserWithdrawal {
    userId: string;
    amount: number;
    currency: string;
    walletAddress: string;
}

export class ClientTransaction {
    private static instance: ClientTransaction;
    private mailjet = MailSender.getInstance()
    private user = User;
    private wallet = Wallet;
    private Transaction = TransactionModel;
    private AdminTransaction = AdminTransaction
    private Notification = NotificationModel;


    private constructor() { }

    public static getInstance(): ClientTransaction {
        if (!ClientTransaction.instance) {
            ClientTransaction.instance = new ClientTransaction();
        }

        return ClientTransaction.instance
    }


    public async userDeposit(userData: IUserDeposit) {
        try {
            const { userId, amount, currency } = userData;
            const userObjectId = new mongoose.Types.ObjectId(userId);
            let parsedAmount = amount;


            const isExist = await this.user.findById(userObjectId);
            if (!isExist) throw new Error("user isn`t registered");

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
                type: PaymentType.DEPOSIT,
                currency: currency.toUpperCase(),
                requestedAmount: creditedAmountInKobo,
                creditedAmount: 0,
                status: PaymentStatus.PENDING,
                createdAt: new Date(),
                userEmail: isExist.email,
                userFullName: isExist.fullName,
            })

            await this.AdminTransaction.create({
                userId: userObjectId,
                fullName: isExist.fullName,
                userName: isExist.userName,
                email: isExist.email,
                type: AdminTransactionType.DEPOSIT,
                creditedAmount: creditedAmountInKobo,
                currency: currency.toUpperCase(),
                status: AdminTransactionStatus.PENDING,
                transactionId: transaction._id,
            })

            await this.Notification.create({
                user: userObjectId,
                type: NotificationType.DEPOSIT,
                title: "Your Deposit Request",
                message: `Hello ${isExist.fullName}, your deposit request of ${parsedAmount} ${currency.toUpperCase()} has been received and is pending approval.`,
                data: { amount: parsedAmount, currency: currency.toUpperCase() },
                priority: NotificationPriority.MEDIUM,
                category: NotificationType.DEPOSIT,
                actionUrl: `/wallet`,
                icon: NotificationType.DEPOSIT,
            })

            const userInfo = {
                userId: userObjectId,
                type: PaymentType.DEPOSIT,
                currency: currency.toUpperCase(),
                requestedAmount: creditedAmountInKobo,
                status: PaymentStatus.PENDING,
                createdAt: new Date(),
                userEmail: isExist.email,
                userFullName: isExist.fullName,
            }

            await this.mailjet.sendUserDeposit(userInfo.userEmail, userInfo.userId, userInfo.type, userInfo.currency, userInfo.requestedAmount as number, userInfo.status, userInfo.createdAt, userInfo.userEmail, userInfo.userFullName);

            return {
                success: true,
                message: "Deposit request submitted successfully",
                data: {
                    transactionId: transaction._id,
                    amount: parsedAmount,
                    currency: currency.toUpperCase(),
                    status: PaymentStatus.PENDING,
                },
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`deposit failed: ${errorMessage}`);
        }
    }

    public async userWithdrawal(userData: IUserWithdrawal) {
        try {
            const { userId, amount, currency, walletAddress } = userData;
            const userObjectId = new mongoose.Types.ObjectId(userId);

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
                type: PaymentType.WITHDRAW,
                currency: currency.toUpperCase(),
                requestedAmount: creditedAmountInKobo,
                creditedAmount: 0, // Will be updated on confirmation
                status: PaymentStatus.PENDING,
                createdAt: new Date(),
                userEmail: isExist.email,
                userFullName: isExist.fullName,
            })

            await this.AdminTransaction.create({
                userId: userObjectId,
                fullName: isExist.fullName,
                userName: isExist.userName,
                email: isExist.email,
                type: AdminTransactionType.WITHDRAW,
                creditedAmount: creditedAmountInKobo,
                currency: currency.toUpperCase(),
                status: AdminTransactionStatus.PENDING,
                walletAddress: walletAddress,
                transactionId: Transaction._id,
            })

            await this.Notification.create({
                user: userObjectId,
                type: NotificationType.WITHDRAWAL,
                title: "Withdrawal Request Received",
                message: `Hello ${isExist.fullName}, your withdrawal request of ${amount} ${currency.toUpperCase()} has been received and is pending approval.`,
                data: { amount: amount, currency: currency.toUpperCase() },
                priority: NotificationPriority.MEDIUM,
                category: NotificationType.WITHDRAWAL,
                actionUrl: `/wallet`,
                icon: NotificationType.WITHDRAWAL,
            })

            const userInfo = {
                userId: userObjectId,
                type: PaymentType.DEPOSIT,
                currency: currency.toUpperCase(),
                requestedAmount: creditedAmountInKobo,
                status: PaymentStatus.PENDING,
                createdAt: new Date(),
                userEmail: isExist.email,
                userFullName: isExist.fullName,
            }

            await this.mailjet.sendUserWithdrawal(userInfo.userEmail, userInfo.userId, userInfo.type, userInfo.currency, userInfo.requestedAmount as number, userInfo.status, userInfo.createdAt, userInfo.userEmail, userInfo.userFullName);

            return {
                success: true,
                message: "withdraw request submitted successfully",
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`deposit failed: ${errorMessage}`);
        }
    }

}