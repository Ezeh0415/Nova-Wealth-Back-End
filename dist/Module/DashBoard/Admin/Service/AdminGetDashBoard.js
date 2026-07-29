"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGetDashBoard = void 0;
const UserSchema_1 = __importDefault(require("../../../Auth/Model/UserSchema"));
const InvestmentSchema_1 = __importDefault(require("../../../Investment/Model/InvestmentSchema"));
const InvestmentPlanSchema_1 = __importDefault(require("../../../InvestmentPlan/Model/InvestmentPlanSchema"));
const TransactionSchema_1 = __importDefault(require("../../../Transaction/Model/Client/TransactionSchema"));
const WalletSchema_1 = __importDefault(require("../../../Wallet/Model/WalletSchema"));
class AdminGetDashBoard {
    constructor() {
        this.user = UserSchema_1.default;
        this.wallet = WalletSchema_1.default;
        this.investment = InvestmentSchema_1.default;
        this.Transaction = TransactionSchema_1.default;
        this.InvestPlan = InvestmentPlanSchema_1.default;
    }
    static getInstance() {
        if (!AdminGetDashBoard.instance) {
            AdminGetDashBoard.instance = new AdminGetDashBoard();
        }
        return AdminGetDashBoard.instance;
    }
    async getAdminDashboardUsers(userId) {
        let isAdmin;
        isAdmin = await this.user.findById(userId).select("role");
        if (!isAdmin || isAdmin.role !== "admin") {
            throw new Error("Unauthorized access");
        }
        const users = await this.user.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });
        if (!users) {
            throw new Error("No Users Found");
        }
        const totalUser = await this.user.countDocuments();
        const totalInvestment = await this.investment.countDocuments();
        const investments = await this.investment.find().sort({ createdAt: -1 });
        const investPlan = await this.InvestPlan.find();
        return {
            users, // All users' personal information
            totalUser, // Total user count
            totalInvestment, // Total investment count
            investments, // All investment records (could be huge)
            investPlan, // All investment plans 
        };
    }
    async getAdminDashboardWallet() {
        const wallet = await this.wallet.find();
        if (!wallet) {
            throw new Error("no wallet found");
        }
        return {
            wallet
        };
    }
    async getUserTransaction(userId) {
        try {
            const transaction = await this.Transaction.find({ userId });
            return transaction;
        }
        catch (error) {
            throw new Error(`Error Fetching User Transaction ${error}`);
        }
    }
}
exports.AdminGetDashBoard = AdminGetDashBoard;
