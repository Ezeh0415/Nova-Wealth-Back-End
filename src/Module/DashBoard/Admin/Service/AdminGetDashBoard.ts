import User from "../../../Auth/Model/UserSchema";
import Investment from "../../../Investment/Model/InvestmentSchema";
import InvestmentPlan from "../../../InvestmentPlan/Model/InvestmentPlanSchema";
import TransactionModel from "../../../Transaction/Model/Client/TransactionSchema";
import Wallet from "../../../Wallet/Model/WalletSchema";

export class AdminGetDashBoard {
    private static instance: AdminGetDashBoard;
    private user = User;
    private wallet = Wallet;
    private investment = Investment;
    private Transaction = TransactionModel;
    private InvestPlan = InvestmentPlan;

    private constructor() { }

    public static getInstance(): AdminGetDashBoard {
        if (!AdminGetDashBoard.instance) {
            AdminGetDashBoard.instance = new AdminGetDashBoard()
        }

        return AdminGetDashBoard.instance;
    }


    public async getAdminDashboardUsers(userId: any) {
        let isAdmin: any;

        isAdmin = await this.user.findById(userId).select("role");
        
        if (!isAdmin || isAdmin.role !== "admin") {
            throw new Error("Unauthorized access");
        }

        const users = await this.user.find().select("fullName userName email role createdAt");

        if (!users) {
            throw new Error("No Users Found");
        }

        const totalUser = await this.user.countDocuments();
        const totalInvestment = await this.investment.countDocuments();

        const investments = await this.investment.find();

        const investPlan = await this.InvestPlan.find();

        return {
            users, // All users' personal information
            totalUser, // Total user count
            totalInvestment, // Total investment count
            investments, // All investment records (could be huge)
            investPlan, // All investment plans 
        };
    }

    public async getAdminDashboardWallet() {
        const wallet = await this.wallet.find()

        if (!wallet) {
            throw new Error("no wallet found");

        }

        return {
            wallet
        }
    }

    public async getUserTransaction(userId: any) {
        try {
            const transaction = await this.Transaction.find({ userId });
            return transaction
        } catch (error) {
            throw new Error(`Error Fetching User Transaction ${error}`)
        }
    }
}