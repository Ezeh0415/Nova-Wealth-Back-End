import User from "../../../Auth/Model/UserSchema";
import Investment from "../../../Investment/Model/InvestmentSchema";
import InvestmentPlan from "../../../InvestmentPlan/Model/InvestmentPlanSchema";
import { NotificationModel } from "../../../Notification/Model/NotificationSchema";
import Referral from "../../../Referral/Model/Model";
import TransactionModel from "../../../Transaction/Model/Client/TransactionSchema";
import Wallet from "../../../Wallet/Model/WalletSchema";

export class ClientDashboard {
    private static instance: ClientDashboard;
    private user = User;
    private wallet = Wallet;
    private investment = Investment;
    private Transaction = TransactionModel;
    private Notification = NotificationModel;
    private investPlan = InvestmentPlan;
    private referral = Referral

    private constructor() { };

    public static getInstance(): ClientDashboard {
        if (!ClientDashboard.instance) {
            ClientDashboard.instance = new ClientDashboard();
        }
        return ClientDashboard.instance;
    }

    public async getDashboard(userId: string) {
        const wallet = (await this.wallet.findOne({ userId })) || { balance: 0 }
        const investments = await this.investment.find({ userId }).sort({ createdAt: -1 })
        // cast userId to any to satisfy mongoose filter typing (userId is stored as ObjectId in DB)
        const transactions = await this.Transaction.find({ userId: userId as any }).sort({ createdAt: -1 }).limit(10);
        // cast transaction documents to any to access typed properties like `type` and `amount`
        const profits = transactions
            .filter((t) => (t as any).type === "profit")
            .reduce((sum: number, t) => sum + (Number((t as any).amount) || 0), 0);
        const user = await this.user.findById(userId).select("referralLink KycStatus");
        const users = await this.user.findById(userId);
        if (!users) return;
        const userObj = users.toObject();
        const { password, ...safeUser } = userObj;
        const Notification = await this.Notification.find({
            user: userId,
        }).sort({ createdAt: -1 });

        const referral = await this.referral.find({ referrer: userId });

        return {
            wallet, // Wallet balance and details
            investments, // All investment records
            transactions, // Recent transaction history
            profits, // Calculated total profits
            Notification,
            accountStatus: user, // User verification status
            user: safeUser,
            referral,
        };
    }

    public async getInvestPlan() {
        const investPlan = await this.investPlan.find();
        if (!investPlan) {
            throw new Error("Error Getting Investment Plans");
        }

        return investPlan;
    }
}