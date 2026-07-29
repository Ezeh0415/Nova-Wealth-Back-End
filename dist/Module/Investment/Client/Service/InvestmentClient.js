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
exports.ClientInvestment = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const InvestmentPlanSchema_1 = __importDefault(require("../../../InvestmentPlan/Model/InvestmentPlanSchema"));
const UserSchema_1 = __importDefault(require("../../../Auth/Model/UserSchema"));
const WalletSchema_1 = __importDefault(require("../../../Wallet/Model/WalletSchema"));
const InvestmentSchema_1 = __importStar(require("../../Model/InvestmentSchema"));
const TransactionSchema_1 = __importStar(require("../../../Transaction/Model/Client/TransactionSchema"));
const AdminTransction_1 = __importStar(require("../../../Transaction/Model/Admin/AdminTransction"));
const NotificationSchema_1 = require("../../../Notification/Model/NotificationSchema");
const Mailjet_1 = require("../../../../Middleware/GmailSetup/Mailjet");
class ClientInvestment {
    constructor() {
        this.InvestPlan = InvestmentPlanSchema_1.default;
        this.user = UserSchema_1.default;
        this.wallet = WalletSchema_1.default;
        this.investment = InvestmentSchema_1.default;
        this.Transaction = TransactionSchema_1.default;
        this.adminTransaction = AdminTransction_1.default;
        this.Notification = NotificationSchema_1.NotificationModel;
        this.mailjet = Mailjet_1.MailSender.getInstance();
    }
    ;
    static getInstance() {
        if (!ClientInvestment.instance) {
            ClientInvestment.instance = new ClientInvestment();
        }
        return ClientInvestment.instance;
    }
    async getROIForInvestmentType(investmentType) {
        try {
            const plan = await this.InvestPlan.findOne({
                planId: investmentType,
                isActive: true,
            });
            if (!plan) {
                throw new Error(`Investment plan "${investmentType}" not found or inactive`);
            }
            return plan.roi;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
    async getDurationForInvestmentType(investmentType) {
        try {
            const plan = await this.InvestPlan.findOne({
                planId: investmentType,
                isActive: true,
            });
            if (!plan) {
                throw new Error(`Investment plan "${investmentType}" not found or inactive`);
            }
            return plan.duration;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
    async invest(Data) {
        try {
            const { userId, amount, investmentType, uniqueId } = Data;
            const plan = await this.InvestPlan.findOne({
                planId: investmentType,
                isActive: true,
            });
            if (!plan) {
                throw new Error(`Investment plan "${investmentType}" not found or inactive`);
            }
            ;
            if (amount < plan.minAmount) {
                throw new Error(`Minimum investment for ${plan.name} is $${plan.minAmount}`);
            }
            ;
            if (amount > plan.maxAmount) {
                throw new Error(`Maximum investment for ${plan.name} is $${plan.maxAmount}`);
            }
            ;
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            const user = await this.user.findById(userObjectId);
            if (!user) {
                throw new Error("User not found");
            }
            ;
            const wallet = await this.wallet.findOne({ userId: userObjectId });
            if (!wallet) {
                throw new Error("Wallet not found for user");
            }
            const creditedAmountInKobo = amount * 100;
            if (wallet.pending < creditedAmountInKobo) {
                throw new Error(`Insufficient balance. Available: $${wallet.balance / 100}, Required: $${amount}`);
            }
            const roi = plan.roi;
            wallet.pending -= creditedAmountInKobo;
            wallet.pendingInvestment =
                (wallet.pendingInvestment || 0) + creditedAmountInKobo;
            await wallet.save();
            const investment = new this.investment({
                userId: userObjectId,
                amount: creditedAmountInKobo,
                roi: roi,
                investmentType: investmentType,
                investmentPlanName: plan.name, // Store plan name for reference
                investmentStatus: InvestmentSchema_1.InvestmentStatus.PENDING,
                planId: plan.planId, // Reference to plan
                uniqueId: uniqueId
            });
            await investment.save();
            const transaction = new this.Transaction({
                userId: userObjectId,
                type: TransactionSchema_1.PaymentType.INVESTMENT,
                creditedAmount: creditedAmountInKobo,
                description: `Investment request - ${plan.name} (${investmentType})`,
                status: TransactionSchema_1.PaymentStatus.PENDING,
                transactionId: investment._id,
                uniqueId: uniqueId
            });
            await transaction.save();
            const adminTransaction = new this.adminTransaction({
                userId: userObjectId,
                transactionId: investment._id,
                fullName: user.fullName,
                userName: user.userName,
                email: user.email,
                type: AdminTransction_1.AdminTransactionType.INVESTMENT,
                creditedAmount: creditedAmountInKobo,
                status: AdminTransction_1.AdminTransactionStatus.PENDING,
                investmentType: investmentType,
                investmentPlanName: plan.name,
                plan_id: investmentType,
                uniqueId: uniqueId
            });
            await adminTransaction.save();
            await this.Notification.create({
                user: userObjectId,
                type: NotificationSchema_1.NotificationType.INVESTMENT,
                title: "Investment Request Created",
                message: `Your ${plan.name} investment request of $${amount} has been created and is pending approval.`,
                data: {
                    investmentId: investment._id,
                    amount: amount,
                    planName: plan.name,
                    roi: roi,
                },
                category: NotificationSchema_1.NotificationType.INVESTMENT,
                icon: NotificationSchema_1.NotificationType.INVESTMENT,
            });
            const userData = {
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
                appName: "Nova-Wealth-GLOBAL"
            };
            const subject = `${user.fullName} Your ${plan.name} investment request of $${amount} has been created and is pending approval.`;
            await this.mailjet.Investment(user.email, subject, userData);
            return {
                success: true,
                message: "Investment request created successfully. Awaiting confirmation.",
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
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to initiate investment plan: ${error.message}`);
            }
            throw new Error('Failed to initiate investment plan: Unknown error');
        }
    }
}
exports.ClientInvestment = ClientInvestment;
