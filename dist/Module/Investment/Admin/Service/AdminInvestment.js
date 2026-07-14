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
exports.AdminInvestmentService = void 0;
const Mailjet_1 = require("../../../../Middleware/GmailSetup/Mailjet");
const UserSchema_1 = __importDefault(require("../../../Auth/Model/UserSchema"));
const InvestmentPlanSchema_1 = __importDefault(require("../../../InvestmentPlan/Model/InvestmentPlanSchema"));
const NotificationSchema_1 = require("../../../Notification/Model/NotificationSchema");
const AdminTransction_1 = __importStar(require("../../../Transaction/Model/Admin/AdminTransction"));
const TransactionSchema_1 = __importStar(require("../../../Transaction/Model/Client/TransactionSchema"));
const WalletSchema_1 = __importDefault(require("../../../Wallet/Model/WalletSchema"));
const InvestmentSchema_1 = __importStar(require("../../Model/InvestmentSchema"));
class AdminInvestmentService {
    constructor() {
        this.userModels = UserSchema_1.default;
        this.WalletModel = WalletSchema_1.default;
        this.InvestmentModel = InvestmentSchema_1.default;
        this.TransactionModel = TransactionSchema_1.default;
        this.InvestmentPlanModel = InvestmentPlanSchema_1.default;
        this.NotificationModel = NotificationSchema_1.NotificationModel;
        this.AdminTransactionModel = AdminTransction_1.default;
        this.mailjet = Mailjet_1.MailSender.getInstance();
    }
    static getInstance() {
        if (!AdminInvestmentService.instance) {
            AdminInvestmentService.instance = new AdminInvestmentService();
        }
        return AdminInvestmentService.instance;
    }
    async getROIForInvestmentType(investmentType) {
        try {
            const plan = await this.InvestmentPlanModel.findOne({
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
                throw new Error(`Failed to retrieve investment plan: ${error.message}`);
            }
            throw new Error('Failed to retrieve investment plan: Unknown error');
        }
    }
    async getDurationForInvestmentType(investmentType) {
        try {
            const plan = await this.InvestmentPlanModel.findOne({
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
                throw new Error(`Failed to retrieve investment plan: ${error.message}`);
            }
            throw new Error('Failed to retrieve investment plan: Unknown error');
        }
    }
    async confirmInvestment(investmentId) {
        try {
            // 1. FIND INVESTMENT
            const investment = await this.InvestmentModel.findById(investmentId);
            if (!investment) {
                throw new Error("Investment not found");
            }
            // 2. CHECK STATUS
            if (investment.investmentStatus !== "pending") {
                throw new Error(`Investment is already ${investment.investmentStatus}`);
            }
            const user = await this.userModels.findOne({ _id: investment.userId });
            if (!user) {
                throw new Error(`User not found for userId: ${investment.userId}`);
            }
            // 3. FIND USER'S WALLET
            const wallet = await this.WalletModel.findOne({
                userId: investment.userId,
            });
            if (!wallet) {
                throw new Error("Wallet not found");
            }
            // 4. FIND INVESTMENT PLAN FOR DURATION
            const plan = await this.InvestmentPlanModel.findOne({
                planId: investment.investmentType,
            });
            if (!plan) {
                throw new Error(`Investment plan "${investment.investmentType}" not found`);
            }
            // 5. MOVE FUNDS FROM PENDING TO INVESTMENT BALANCE
            if (wallet.pendingInvestment < investment.amount) {
                throw new Error("Insufficient pending investment balance");
            }
            wallet.pendingInvestment -= investment.amount;
            wallet.invBalance = (wallet.invBalance || 0) + investment.amount;
            await wallet.save();
            console.log(`✅ Moved ${investment.amount / 100} from pending to investment balance`);
            // 6. SET ACTUAL DATES BASED ON PLAN DURATION
            const actualStartDate = new Date();
            const actualEndDate = new Date(actualStartDate);
            actualEndDate.setDate(actualEndDate.getDate() + plan.duration);
            // 7. UPDATE INVESTMENT
            investment.investmentStartDate = actualStartDate;
            investment.investmentEndDate = actualEndDate;
            investment.investmentStatus = InvestmentSchema_1.InvestmentStatus.ACTIVE;
            investment.lastRoiAt = actualStartDate; // Initialize ROI tracking
            await investment.save();
            // 8. UPDATE ADMIN TRANSACTION
            await this.AdminTransactionModel.updateOne({ transactionId: investment._id }, { status: AdminTransction_1.AdminTransactionStatus.ACTIVE });
            // 9. UPDATE USER TRANSACTION
            await this.TransactionModel.updateOne({ transactionId: investment._id }, { status: TransactionSchema_1.PaymentStatus.ACTIVE });
            // 10. SEND NOTIFICATION
            await this.NotificationModel.create({
                user: investment.userId,
                type: NotificationSchema_1.NotificationType.INVESTMENT,
                title: "Investment Activated! 🎉",
                message: `Your ${plan.name} investment of $${(investment.amount / 100).toFixed(2)} is now active. It will mature on ${actualEndDate.toLocaleDateString()}.`,
                data: {
                    investmentId: investment._id,
                    startDate: actualStartDate,
                    endDate: actualEndDate,
                    planName: plan.name,
                    roi: plan.roi,
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
                formatType: "confirmed",
                appName: "ALTHWORLD-GLOBAL"
            };
            const subject = `${user.fullName} Your ${plan.name} investment of $${(investment.amount / 100).toFixed(2)} is now active. It will mature on ${actualEndDate.toLocaleDateString()}.`;
            await this.mailjet.Investment(user.email, subject, userData);
            return {
                success: true,
                message: "Investment confirmed and activated successfully",
                investment: {
                    id: investment._id,
                    amount: investment.amount / 100,
                    investmentType: investment.investmentType,
                    planName: plan.name,
                    roi: investment.roi,
                    startDate: actualStartDate,
                    endDate: actualEndDate,
                    duration: plan.duration,
                    status: "active",
                },
                wallet: {
                    pendingInvestment: wallet.pendingInvestment / 100,
                    invBalance: wallet.invBalance / 100,
                    balance: wallet.balance / 100,
                },
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to confirm investment : ${error.message}`);
            }
            throw new Error('Failed to confirm investment : Unknown error');
        }
    }
    async processDailyROI() {
        try {
            const now = new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today for date comparison
            // Get all ACTIVE investments
            const investments = await this.InvestmentModel.find({
                investmentStatus: "active",
            });
            console.log(investments.length, "active investments found for ROI processing");
            console.log(`🔄 Processing ROI for ${investments.length} active investments`);
            for (const inv of investments) {
                try {
                    // Check if investment has expired
                    if (now >= inv.investmentEndDate) {
                        await this.completeInvestment(inv._id);
                        continue;
                    }
                    // FIX 1: Use date-based check instead of hours
                    const lastRunDate = inv.lastRoiAt
                        ? new Date(inv.lastRoiAt)
                        : new Date(inv.investmentStartDate);
                    // Compare dates (ignoring time)
                    const lastRunDay = new Date(lastRunDate);
                    lastRunDay.setHours(0, 0, 0, 0);
                    // If already processed today, skip
                    if (lastRunDay.getTime() === today.getTime()) {
                        continue;
                    }
                    // Get ROI rate from plan
                    const plan = await this.InvestmentPlanModel.findOne({
                        planId: inv.investmentType,
                    });
                    if (!plan) {
                        console.warn(`Plan not found for investment type: ${inv.investmentType}`);
                        continue;
                    }
                    // FIX 2: Calculate compound interest based on current total
                    const currentTotal = inv.amount + (inv.TotalReturns || 0);
                    const dailyRate = plan.roi / 100;
                    let profit = Math.round(currentTotal * dailyRate);
                    // FIX 3: Ensure at least 1 kobo profit if calculation rounds to 0
                    if (profit === 0 && currentTotal * dailyRate > 0) {
                        profit = 1;
                    }
                    // FIX 4: Check if investment has reached maximum allowed (if plan has max amount)
                    if (plan.maxAmount) {
                        const maxInKobo = plan.maxAmount * 100;
                        const projectedTotal = currentTotal + profit;
                        if (projectedTotal > maxInKobo) {
                            // Only add enough to reach max
                            profit = maxInKobo - currentTotal;
                            if (profit <= 0) {
                                // Already at max, complete investment
                                await this.completeInvestment(inv._id);
                                continue;
                            }
                        }
                    }
                    // Update investment returns
                    inv.TotalReturns = (inv.TotalReturns || 0) + profit;
                    inv.lastRoiAt = now; // Store full datetime for reference
                    await inv.save();
                    // Update wallet investment balance
                    await this.WalletModel.updateOne({ userId: inv.userId }, { $inc: { invBalance: profit } });
                    // Create transaction record
                    await this.TransactionModel.create({
                        userId: inv.userId,
                        transactionId: inv._id,
                        type: "profit",
                        creditedAmount: profit,
                        description: `Daily ROI (${plan.roi}%) for ${plan.name} investment`,
                        status: "completed",
                    });
                    console.log(` Credited $${(profit / 100).toFixed(2)} ROI for investment ${inv._id} (Total now: $${((currentTotal + profit) / 100).toFixed(2)})`);
                }
                catch (error) {
                    console.error(`Error processing ROI for investment ${inv._id}:`, error.message);
                    // Continue with other investments
                }
            }
            console.log(` Completed daily ROI processing`);
        }
        catch (error) {
            console.error(" Daily ROI processing error:", error);
        }
    }
    async completeInvestment(investmentId) {
        // Handle array of IDs
        if (Array.isArray(investmentId)) {
            const results = [];
            for (const id of investmentId) {
                try {
                    const res = await this._completeSingleInvestment(id);
                    results.push({ id, success: true, investment: res });
                }
                catch (err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    results.push({
                        id,
                        success: false,
                        error: errorMessage,
                    });
                }
            }
            return results;
        }
        // Single investment
        return await this._completeSingleInvestment(investmentId);
    }
    async _completeSingleInvestment(investmentId) {
        const investment = await this.InvestmentModel.findById(investmentId);
        if (!investment) {
            throw new Error("Investment not found");
        }
        // Only proceed if active
        if (investment.investmentStatus !== "active") {
            return investment;
        }
        const user = await this.userModels.findOne({ _id: investment.userId });
        if (!user) {
            throw new Error(`User not found for userId: ${investment.userId}`);
        }
        // Find user's wallet
        const wallet = await this.WalletModel.findOne({
            userId: investment.userId,
        });
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        // Calculate total to return (capital + accumulated returns)
        const totalInvBalance = wallet.invBalance || 0;
        const capital = investment.amount || 0;
        const returns = totalInvBalance - capital > 0 ? totalInvBalance - capital : 0;
        // Transfer to main balance
        wallet.balance = (wallet.balance || 0) + totalInvBalance;
        wallet.totalReturn = (wallet.totalReturn || 0) + returns;
        wallet.invBalance = wallet.invBalance - totalInvBalance; // Reset to 0
        await wallet.save();
        // Update investment status
        investment.investmentStatus = InvestmentSchema_1.InvestmentStatus.COMPLETED;
        investment.investmentEndDate = new Date();
        await investment.save();
        // Update transactions
        await this.TransactionModel.updateMany({ transactionId: investment._id, status: "active" }, { status: TransactionSchema_1.PaymentStatus.COMPLETED });
        // Create admin transaction for completion
        await this.AdminTransactionModel.create({
            userId: investment.userId,
            transactionId: investment._id,
            type: AdminTransction_1.AdminTransactionType.INVESTMENT,
            creditedAmount: totalInvBalance,
            status: AdminTransction_1.AdminTransactionStatus.COMPLETED,
            investmentType: investment.investmentType,
        });
        // Send notification
        await this.NotificationModel.create({
            user: investment.userId,
            type: NotificationSchema_1.NotificationType.INVESTMENT,
            title: "Investment Completed! 🎊",
            message: `Your ${investment.investmentType} investment has completed. $${(totalInvBalance / 100).toFixed(2)} (Capital: $${(capital / 100).toFixed(2)} + Returns: $${(returns / 100).toFixed(2)}) has been credited to your wallet.`,
            data: {
                investmentId: investment._id,
                capital: capital / 100,
                returns: returns / 100,
                total: totalInvBalance / 100,
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
            formatType: "completed",
            appName: "ALTHWORLD-GLOBAL"
        };
        const subject = `${user.fullName} Your ${investment.investmentType} investment has completed. $${(totalInvBalance / 100).toFixed(2)} (Capital: $${(capital / 100).toFixed(2)} + Returns: $${(returns / 100).toFixed(2)}) has been credited to your wallet.`;
        await this.mailjet.Investment(user.email, subject, userData);
        return {
            investment,
            summary: {
                capital: capital / 100,
                returns: returns / 100,
                total: totalInvBalance / 100,
                status: "completed",
            },
        };
    }
    async cancelInvestment(investmentId) {
        try {
            const investment = await this.InvestmentModel.findById(investmentId);
            if (!investment) {
                throw new Error("Investment not found");
            }
            if (investment.investmentStatus !== "pending") {
                throw new Error(`Cannot cancel ${investment.investmentStatus} investment`);
            }
            // Refund to wallet
            const wallet = await this.WalletModel.findOne({
                userId: investment.userId,
            });
            if (wallet) {
                wallet.balance += investment.amount;
                wallet.pendingInvestment -= investment.amount;
                await wallet.save();
            }
            // Update investment
            investment.investmentStatus = InvestmentSchema_1.InvestmentStatus.CANCELLED;
            investment.cancelledAt = new Date();
            await investment.save();
            // Update transactions
            await this.TransactionModel.updateOne({
                transactionId: investment._id,
            }, { status: TransactionSchema_1.PaymentStatus.CANCELLED });
            await this.AdminTransactionModel.updateOne({
                transactionId: investment._id,
            }, { status: AdminTransction_1.AdminTransactionStatus.CANCELLED });
            // Send notification
            await this.NotificationModel.create({
                user: investment.userId,
                type: NotificationSchema_1.NotificationType.INVESTMENT,
                title: "Investment Cancelled",
                message: `Your ${investment.investmentType} investment of $${(investment.amount / 100).toFixed(2)} has been cancelled and refunded.`,
                data: { investmentId: investment._id },
                category: NotificationSchema_1.NotificationType.INVESTMENT,
                icon: NotificationSchema_1.NotificationType.INVESTMENT,
            });
            const user = await this.userModels.findById(investment.userId);
            if (!user) {
                throw new Error("No user Match");
            }
            const plan = await this.InvestmentPlanModel.findOne({
                planId: investment.investmentType,
            });
            if (!plan) {
                throw new Error(`Investment plan "${investment.investmentType}" not found`);
            }
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
                formatType: "Cancelled",
                appName: "ALTHWORLD-GLOBAL"
            };
            const subject = `${user.fullName} Your ${plan.name} investment of $${(investment.amount / 100).toFixed(2)} was cancelled.`;
            await this.mailjet.Investment(user.email, subject, userData);
            return investment;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to confirm investment : ${error.message}`);
            }
            throw new Error('Failed to confirm investment : Unknown error');
        }
    }
}
exports.AdminInvestmentService = AdminInvestmentService;
