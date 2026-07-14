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
exports.AdminKycService = void 0;
const UserSchema_1 = __importDefault(require("../../../Auth/Model/UserSchema"));
const NotificationSchema_1 = require("../../../Notification/Model/NotificationSchema");
const AdminTransction_1 = __importStar(require("../../../Transaction/Model/Admin/AdminTransction"));
const KycSchema_1 = __importDefault(require("../../Model/KycSchema"));
const kycLink = `${process.env.FRONTEND_URL}/Kyc`;
class AdminKycService {
    constructor() {
        this.kyc = KycSchema_1.default;
        this.user = UserSchema_1.default;
        this.Notification = NotificationSchema_1.NotificationModel;
        this.adminTransaction = AdminTransction_1.default;
    }
    ;
    static getInstance() {
        if (!AdminKycService.instance) {
            AdminKycService.instance = new AdminKycService();
        }
        return AdminKycService.instance;
    }
    async ConfirmKyc(userData) {
        try {
            const user = await this.user.findById(userData.userId);
            if (!user) {
                throw new Error("User Not Found");
            }
            const kyc = await this.kyc.findOne({ userId: userData.userId, _id: userData.KycId });
            if (!kyc) {
                throw new Error("Kyc Not Found");
            }
            kyc.KycStatus = "verified";
            await kyc.save();
            user.KycStatus = "verified";
            user.isActive = true;
            await user.save();
            const adminTransaction = await this.adminTransaction.findOne({
                userId: userData.userId,
                transactionId: userData.KycId,
            });
            if (!adminTransaction) {
                throw new Error("kyc transaction not found");
            }
            adminTransaction.isConfirmed = AdminTransction_1.AdminTransactionConfirmation.TRUE;
            await adminTransaction.save();
            await this.Notification.create({
                user: userData.userId,
                transactionId: kyc._id,
                title: "kyc confirmed and verified ",
                type: "kyc",
                message: "kyc verified",
                priority: "low",
                path: kycLink,
                category: "kyc",
            });
            return kyc;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
    async CancelKyc(userData) {
        try {
            const user = await this.user.findById(userData.userId);
            if (!user) {
                throw new Error("User not found");
            }
            const kyc = await this.kyc.findOne({ userId: userData.userId, _id: userData.KycId });
            if (!kyc) {
                throw new Error("kyc not found");
            }
            kyc.KycStatus = "unverified";
            kyc.Comments =
                "kyc failed might be too much trafic try again in a little while";
            await kyc.save();
            user.KycStatus = "unverified";
            await user.save();
            const adminTransaction = await this.adminTransaction.findOne({
                userId: userData.userId,
                fullName: user.fullName,
                userName: user.userName,
                email: user.email,
                transactionId: userData.KycId,
            });
            if (!adminTransaction) {
                throw new Error("Kyc Transaction Not Found");
            }
            adminTransaction.isConfirmed = AdminTransction_1.AdminTransactionConfirmation.FAILED;
            await adminTransaction.save();
            await this.Notification.create({
                user: userData.userId,
                transactionId: kyc._id,
                title: "kyc invalid and unverified ",
                type: "kyc",
                message: "kyc failed",
                priority: "urgent",
                path: kycLink,
                category: "kyc",
            });
            return kyc;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
}
exports.AdminKycService = AdminKycService;
