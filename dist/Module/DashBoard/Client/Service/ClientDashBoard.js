"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientDashboard = void 0;
const UserSchema_1 = __importDefault(require("../../../Auth/Model/UserSchema"));
const InvestmentSchema_1 = __importDefault(require("../../../Investment/Model/InvestmentSchema"));
const InvestmentPlanSchema_1 = __importDefault(require("../../../InvestmentPlan/Model/InvestmentPlanSchema"));
const NotificationSchema_1 = require("../../../Notification/Model/NotificationSchema");
const Model_1 = __importDefault(require("../../../Referral/Model/Model"));
const TransactionSchema_1 = __importDefault(require("../../../Transaction/Model/Client/TransactionSchema"));
const WalletSchema_1 = __importDefault(require("../../../Wallet/Model/WalletSchema"));
class ClientDashboard {
    constructor() {
        this.user = UserSchema_1.default;
        this.wallet = WalletSchema_1.default;
        this.investment = InvestmentSchema_1.default;
        this.Transaction = TransactionSchema_1.default;
        this.Notification = NotificationSchema_1.NotificationModel;
        this.investPlan = InvestmentPlanSchema_1.default;
        this.referral = Model_1.default;
    }
    ;
    static getInstance() {
        if (!ClientDashboard.instance) {
            ClientDashboard.instance = new ClientDashboard();
        }
        return ClientDashboard.instance;
    }
    async getDashboard(userId) {
        const wallet = (await this.wallet.findOne({ userId })) || { balance: 0 };
        const investments = await this.investment.find({ userId }).sort({ createdAt: -1 });
        // cast userId to any to satisfy mongoose filter typing (userId is stored as ObjectId in DB)
        const transactions = await this.Transaction.find({ userId: userId }).sort({ createdAt: -1 }).limit(10);
        // cast transaction documents to any to access typed properties like `type` and `amount`
        const profits = transactions
            .filter((t) => t.type === "profit")
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const user = await this.user.findById(userId).select("referralLink KycStatus");
        const users = await this.user.findById(userId);
        if (!users)
            return;
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
    async getInvestPlan() {
        const investPlan = await this.investPlan.find();
        if (!investPlan) {
            throw new Error("Error Getting Investment Plans");
        }
        return investPlan;
    }
}
exports.ClientDashboard = ClientDashboard;
