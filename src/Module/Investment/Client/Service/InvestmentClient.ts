import mongoose from "mongoose";
import InvestmentPlan from "../../../InvestmentPlan/Model/InvestmentPlanSchema";
import User from "../../../Auth/Model/UserSchema";
import Wallet from "../../../Wallet/Model/WalletSchema";
import Investment, { InvestmentStatus } from "../../Model/InvestmentSchema";
import TransactionModel, { PaymentStatus, PaymentType } from "../../../Transaction/Model/Client/TransactionSchema";
import AdminTransaction, { AdminTransactionStatus, AdminTransactionType } from "../../../Transaction/Model/Admin/AdminTransction";
import { NotificationModel, NotificationType } from "../../../Notification/Model/NotificationSchema";
import { IInvestEmail, MailSender } from "../../../../Middleware/GmailSetup/Mailjet";

export interface IInvest {
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    investmentType: string,
}

export class ClientInvestment {
    private static instance: ClientInvestment;
    private InvestPlan = InvestmentPlan;
    private user = User
    private wallet = Wallet;
    private investment = Investment;
    private Transaction = TransactionModel;
    private adminTransaction = AdminTransaction;
    private Notification = NotificationModel;
    private mailjet = MailSender.getInstance();

    private constructor() { };

    public static getInstance(): ClientInvestment {
        if (!ClientInvestment.instance) {
            ClientInvestment.instance = new ClientInvestment()
        }

        return ClientInvestment.instance;
    }

    private async getROIForInvestmentType(investmentType: string) {
        try {
            const plan = await this.InvestPlan.findOne({
                planId: investmentType,
                isActive: true,
            })


            if (!plan) {
                throw new Error(
                    `Investment plan "${investmentType}" not found or inactive`,
                );
            }

            return plan.roi;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }

    private async getDurationForInvestmentType(investmentType: string) {
        try {
            const plan = await this.InvestPlan.findOne({
                planId: investmentType,
                isActive: true,
            });

            if (!plan) {
                throw new Error(
                    `Investment plan "${investmentType}" not found or inactive`,
                );
            }

            return plan.duration;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }

    public async invest(Data: IInvest) {
        try {

            const { userId, amount, investmentType } = Data;

            const plan = await this.InvestPlan.findOne({
                planId: investmentType,
                isActive: true,
            });

            if (!plan) {
                throw new Error(
                    `Investment plan "${investmentType}" not found or inactive`,
                );
            };


            if (amount < plan.minAmount) {
                throw new Error(
                    `Minimum investment for ${plan.name} is $${plan.minAmount}`,
                );
            };

            if (amount > plan.maxAmount) {
                throw new Error(
                    `Maximum investment for ${plan.name} is $${plan.maxAmount}`,
                );
            };

            const userObjectId = new mongoose.Types.ObjectId(userId);

            const user = await this.user.findById(userObjectId);

            if (!user) {
                throw new Error("User not found");
            };

            const wallet = await this.wallet.findOne({ userId: userObjectId });

            if (!wallet) {
                throw new Error("Wallet not found for user");
            }

            const creditedAmountInKobo = amount * 100;

            if (wallet.balance < creditedAmountInKobo) {
                throw new Error(
                    `Insufficient balance. Available: $${wallet.balance / 100}, Required: $${amount}`,
                );
            }

            const roi = plan.roi;

            wallet.balance -= creditedAmountInKobo;
            wallet.pendingInvestment =
                (wallet.pendingInvestment || 0) + creditedAmountInKobo;
            await wallet.save();

            const investment = new this.investment({
                userId: userObjectId,
                amount: creditedAmountInKobo,
                roi: roi,
                investmentType: investmentType,
                investmentPlanName: plan.name, // Store plan name for reference
                investmentStatus: InvestmentStatus.PENDING,
                planId: plan.planId, // Reference to plan
            });

            await investment.save();

            const transaction = new this.Transaction({
                userId: userObjectId,
                type: PaymentType.INVESTMENT,
                creditedAmount: creditedAmountInKobo,
                description: `Investment request - ${plan.name} (${investmentType})`,
                status: PaymentStatus.PENDING,
                transactionId: investment._id,
            });

            await transaction.save();

            const adminTransaction = new this.adminTransaction({
                userId: userObjectId,
                transactionId: investment._id,
                fullName: user.fullName,
                userName: user.userName,
                email: user.email,
                type: AdminTransactionType.INVESTMENT,
                creditedAmount: creditedAmountInKobo,
                status: AdminTransactionStatus.PENDING,
                investmentType: investmentType,
                investmentPlanName: plan.name,
            });

            await adminTransaction.save();

            await this.Notification.create({
                user: userObjectId,
                type: NotificationType.INVESTMENT,
                title: "Investment Request Created",
                message: `Your ${plan.name} investment request of $${amount} has been created and is pending approval.`,
                data: {
                    investmentId: investment._id,
                    amount: amount,
                    planName: plan.name,
                    roi: roi,
                },
                category: NotificationType.INVESTMENT,
                icon: NotificationType.INVESTMENT,
            });

            const userData: IInvestEmail = {
                _id: investment._id,
                userId: investment.userId,
                amount: investment.amount,
                roi: investment.roi,
                TotalReturns: investment.TotalReturns, // $1,250.00
                lastRoiAt: investment.lastRoiAt,
                investmentType: investment.investmentType,
                investmentStatus: investment.investmentStatus,
                investmentStartDate: investment.investmentStartDate,
                createdAt: investment.createdAt,
                formatType: "Request Created",
                appName: "ALTHWORLD-GLOBAL"
            }

            const subject = `${user.fullName} Your ${plan.name} investment request of $${amount} has been created and is pending approval.`;

            await this.mailjet.Investment(user.email, subject, userData);

            return {
                success: true,
                message:
                    "Investment request created successfully. Awaiting confirmation.",
                investment: {
                    id: investment._id,
                    amount: amount,
                    investmentType: investmentType,
                    planName: plan.name,
                    roi: roi,
                    status: "pending",
                },
                wallet: {
                    balance: wallet.balance / 100,
                    pendingInvestment: wallet.pendingInvestment / 100,
                },
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to initiate investment plan: ${error.message}`);
            }
            throw new Error('Failed to initiate investment plan: Unknown error');
        }
    }


}