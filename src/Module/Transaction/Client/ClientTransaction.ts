import { AppConfig } from "../../../config/Config";
import { MailSender } from "../../../Middleware/GmailSetup/Mailjet";
import User from "../../Auth/Model/UserSchema";
import { NotificationModel, NotificationPriority, NotificationType } from "../../Notification/NotificationSchema";
import Wallet from "../../Wallet/WalletSchema";
import AdminTransaction, { AdminTransactionStatus, AdminTransactionType } from "../Model/Admin/AdminTransction";
import TransactionModel, { ITransaction, PaymentStatus, PaymentType } from "../Model/Client/TransactionSchema";

export class ClientTransaction {
    private static instance: ClientTransaction;
    private config: AppConfig;
    private mailjet = MailSender.getInstance()
    private user = User;
    private wallet = Wallet;
    private Transaction = TransactionModel;
    private AdminTransaction = AdminTransaction
    private Notification = NotificationModel;


    private constructor() {
        this.config = AppConfig.getInstance();
    }

    public static getInstance(): ClientTransaction {
        if (!ClientTransaction.instance) {
            ClientTransaction.instance = new ClientTransaction();
        }

        return ClientTransaction.instance
    }

    public async userDeposit(userData: any) {
        try {
            const { userId, amount, currency } = userData;
            let parsedAmount = amount;
            if (typeof amount === "string") {
                parsedAmount = parseFloat(amount);
                if (isNaN(parsedAmount)) {
                    throw new Error("Amount must be a valid number");
                }
            }

            if (!parsedAmount || typeof parsedAmount !== "number" || parsedAmount <= 0) {
                throw new Error("valid number needed");
            }

            const isExist = await this.user.findById(userId);
            if (!isExist) throw new Error("user isn`t registered");

            //  AMOUNT CONVERSION - Convert to smallest unit (kobo/cents)
            const conversionRate = 100; // 1 USD = 100 cents
            const creditedAmountInKobo = Math.round(parsedAmount * conversionRate);

            let wallet = await this.wallet.findOne({ userId: userId });

            if (!wallet) {
                wallet = await this.wallet.create({
                    userId: userId,
                    balance: 0,
                    pending: 0,
                    // currency: currency.toUpperCase(),
                });
            }

            wallet.pending += creditedAmountInKobo;
            await wallet.save();

            const transaction = await this.Transaction.create({
                userId: userId,
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
                userId: userId,
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
                user: userId,
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
                userId: userId,
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

}