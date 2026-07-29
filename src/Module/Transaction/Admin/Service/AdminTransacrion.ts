import { MailSender } from "../../../../Middleware/GmailSetup/Mailjet";
import User from "../../../Auth/Model/UserSchema";
import { AdminInvestmentService } from "../../../Investment/Admin/Service/AdminInvestment";
import { NotificationModel, NotificationType } from "../../../Notification/Model/NotificationSchema";
import Wallet from "../../../Wallet/Model/WalletSchema";
import AdminTransaction, { AdminTransactionConfirmation, AdminTransactionStatus } from "../../Model/Admin/AdminTransction";
import TransactionModel, { PaymentStatus } from "../../Model/Client/TransactionSchema";

interface IDeposit {
    transactionId: string;
}
interface IWithdrawal {
    userId: string;
    transactionId: string;
}

export class AdminTransction {
    private static instance: AdminTransction;
    private AdminSchema = AdminTransaction;
    private user = User;
    private wallet = Wallet;
    private Transaction = TransactionModel;
    private Notification = NotificationModel;
    private mailjet = MailSender.getInstance()
    private AdminInvestmentService: AdminInvestmentService;

    private constructor() {
        this.AdminInvestmentService = AdminInvestmentService.getInstance();
    }

    public static getInstance(): AdminTransction {
        if (!AdminTransction.instance) {
            AdminTransction.instance = new AdminTransction();
        }

        return AdminTransction.instance
    }


    public async AdminGetTransaction(page: number = 1, limit: number = 20) {
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

    public async confirmDeposit(userData: IDeposit) {
        try {
            const { transactionId } = userData;

            const checkTransaction = await this.AdminSchema.findOne({
                uniqueId: transactionId
            });

            if (!checkTransaction) {
                throw new Error(
                    `Admin transaction not found with transactionId: ${transactionId}`,
                );
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
            } else {
                // THIS IS THE USER'S FIRST DEPOSIT
                isFirstDeposit = true;
                user.hasMadeFirstDeposit = true; // Mark user as having made first deposit
                user.firstDepositAmount = checkTransaction.creditedAmount; // Store the deposit amount
                user.firstDepositDate = new Date(); // Record the date
                await user.save(); // Save updated user
            }

            const wallet = await this.wallet.findOne({ userId: checkTransaction?.userId });
            if (!wallet) {
                throw new Error("wallet not found ")
            }

            let transaction;
            
            if (!transaction) {
                transaction = await this.Transaction.findOne({ uniqueId: transactionId } as any);
            }

            if (!transaction) {
                throw new Error(
                    `Transaction not found with ID: ${transactionId}. Tried both _id and transactionId fields.`,
                );
            }

            if (checkTransaction.creditedAmount !== transaction.requestedAmount) {
                throw new Error("amount incompatible")
            }

            const creditedAmountInKobo = checkTransaction.creditedAmount;

            // 8. WALLET UPDATE
            wallet.totalDeposits += creditedAmountInKobo;
            await wallet.save();

            // 9. TRANSACTION UPDATE
            transaction.requestedAmount -= checkTransaction.creditedAmount;
            transaction.creditedAmount = checkTransaction.creditedAmount;
            const status = checkTransaction.creditedAmount < transaction.requestedAmount ? "pending" : "completed";
            transaction.status = status as typeof transaction.status;
            await transaction.save();

            // 10. ADMIN TRANSACTION UPDATE
            checkTransaction.status = AdminTransactionStatus.COMPLETED;
            checkTransaction.isConfirmed = AdminTransactionConfirmation.TRUE;
            await checkTransaction.save();


            await this.Notification.create({
                user: checkTransaction?.userId,
                type: NotificationType.DEPOSIT,
                title: "Deposit Confirmed",
                message: `Your deposit of $${(creditedAmountInKobo / 100).toFixed(2)} has been confirmed.${isFirstDeposit ? " This was your first deposit!" : ""}`,
                category: NotificationType.DEPOSIT,
            })

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
            }

            await this.mailjet.confirmDeposit(user.email, userEmailInput.userId, userEmailInput.type, userEmailInput.currency, userEmailInput.creditedAmount, userEmailInput.status, userEmailInput.creditedAt, userEmailInput.userEmail, userEmailInput.userFullName, userEmailInput.transactionId, userEmailInput.isFirstDeposit);



            // ATTACH INVEST COMPLETE HERE
            await this.AdminInvestmentService.confirmInvestment(checkTransaction?.uniqueId as string);

            return {
                success: true,
                message: "Deposit confirmed successfully",
                wallet,
                transaction,
                isFirstDeposit, // Will show referral bonus result if applicable
            };
        } catch (error) {
            console.error("Error in confirmDeposit:", error);
            throw error;
        }
    }

    public async confirmWithdrawal(userData: IWithdrawal) {
        try {
            const { userId, transactionId } = userData;
            // 1. FIND ADMIN TRANSACTION
            const adminTransaction = await this.AdminSchema.findOne({
                transactionId: transactionId,
            });

            if (!adminTransaction)
                throw new Error(
                    `Admin transaction not found with transactionId: ${transactionId}`,
                );

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
            if (!wallet) throw new Error("Wallet not found");

            // 4. FIND MAIN TRANSACTION
            const transaction = await this.Transaction.findById(transactionId);
            if (!transaction) throw new Error("Transaction not found");

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
            transaction.status = status as typeof transaction.status;

            await transaction.save();

            // 8. ADMIN TRANSACTION UPDATE
            adminTransaction.status = AdminTransactionStatus.COMPLETED;
            adminTransaction.isConfirmed = AdminTransactionConfirmation.TRUE;

            await adminTransaction.save();

            await this.Notification.create({
                user: userId,
                type: NotificationType.DEPOSIT,
                title: "Deposit Confirmed",
                message: `Your Withdrawal of $${(creditedAmountInKobo / 100).toFixed(2)} has been confirmed.`,
            })

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
            }

            await this.mailjet.confirmWithdrawal(user.email, userEmailInput.userId, userEmailInput.type, userEmailInput.currency, userEmailInput.creditedAmount, userEmailInput.status, userEmailInput.creditedAt, userEmailInput.userEmail, userEmailInput.userFullName, userEmailInput.transactionId);

            return {
                success: true,
                message: "withdraw confirmed successfully",
                wallet,
            };
        } catch (error) {
            console.error("Error in confirmWithdrawal:", error);
            throw error;
        }
    }

    public async cancelDeposit(userData: IDeposit) {

        try {
            const { transactionId } = userData;
            // 1. FIND ADMIN TRANSACTION
            const adminTransaction = await this.AdminSchema.findOne({
                uniqueId: transactionId,
            });
            if (!adminTransaction)
                throw new Error(
                    `Admin transaction not found with transactionId: ${transactionId}`,
                );

            // 2. DUPLICATE CONFIRMATION CHECK
            if (adminTransaction.isConfirmed === "true")
                throw new Error("Transaction already confirmed");

            // 3. FIND MAIN TRANSACTION
            const transaction = await this.Transaction.findOne({ uniqueId: transactionId });
            if (!transaction) throw new Error("Transaction not found");

            // 4. FIND USER WALLET
            const wallet = await this.wallet.findOne({ userId: adminTransaction?.userId });
            if (!wallet) throw new Error("Wallet not found");

            // 5. TRANSACTION UPDATE - Mark as canceled
            transaction.status = PaymentStatus.CANCELLED;
            await transaction.save();

            // 7. ADMIN TRANSACTION UPDATE
            adminTransaction.status = AdminTransactionStatus.CANCELLED;
            adminTransaction.isConfirmed = AdminTransactionConfirmation.FALSE;
            await adminTransaction.save();

            // ATTACH INVEST COMPLETE HERE
            await this.AdminInvestmentService.cancelInvestment(adminTransaction?.uniqueId as string);


            return {
                success: true,
                message: "deposit canceled",
                wallet,
            };
        } catch (error) {
            console.error("Error canceling Deposit:", error);
            throw error;
        }
    }

    public async CancelWithdrawal(userData: IWithdrawal) {
        try {
            const { userId, transactionId } = userData;

            // 1. FIND ADMIN TRANSACTION
            const adminTransaction = await this.AdminSchema.findOne({
                transactionId: transactionId,
            });

            if (!adminTransaction)
                throw new Error(
                    `Admin transaction not found with transactionId: ${transactionId}`,
                );

            // 2. DUPLICATE CONFIRMATION CHECK
            if (adminTransaction.isConfirmed === "true")
                throw new Error("Transaction already confirmed");

            // 3. FIND MAIN TRANSACTION
            const transaction = await this.Transaction.findById(transactionId);
            if (!transaction) throw new Error("Transaction not found");

            // 4. FIND USER WALLET
            const wallet = await this.wallet.findOne({ userId });
            if (!wallet) throw new Error("Wallet not found");

            // 5. TRANSACTION UPDATE - Mark as canceled
            transaction.status = PaymentStatus.CANCELLED;
            await transaction.save();

            // 6. AMOUNT CONVERSION
            const creditedAmountInKobo = adminTransaction.creditedAmount;

            // 7. WALLET UPDATE - Return funds from pending withdrawal to balance
            wallet.pendingWithdraw -= creditedAmountInKobo;
            await wallet.save();

            // 8. ADMIN TRANSACTION UPDATE
            adminTransaction.isConfirmed = AdminTransactionConfirmation.FALSE;
            await adminTransaction.save();

            return {
                success: true,
                message: "withdrawal cancel successfully",
                wallet,
                transaction,
            };
        } catch (error) {
            console.error("Error in cancelWithdrawal:", error);
            throw error;
        }
    }

}