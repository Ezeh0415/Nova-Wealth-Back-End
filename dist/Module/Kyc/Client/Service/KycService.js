"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycService = void 0;
const UserSchema_1 = __importDefault(require("../../../Auth/Model/UserSchema"));
const NotificationSchema_1 = require("../../../Notification/Model/NotificationSchema");
const AdminTransction_1 = __importDefault(require("../../../Transaction/Model/Admin/AdminTransction"));
const KycSchema_1 = __importDefault(require("../../Model/KycSchema"));
const kycLink = `${process.env.FRONTEND_URL}/Kyc`;
class KycService {
    constructor() {
        this.user = UserSchema_1.default;
        this.Kyc = KycSchema_1.default;
        this.AdminTransaction = AdminTransction_1.default;
        this.Notification = NotificationSchema_1.NotificationModel;
    }
    ;
    static getInstance() {
        if (!KycService.instance) {
            KycService.instance = new KycService();
        }
        return KycService.instance;
    }
    async VerifyKyc(userData) {
        try {
            const user = await this.user.findById(userData.userId);
            if (!user) {
                throw new Error("User Not Found");
            }
            ;
            const Kyc = await this.Kyc.findByIdAndUpdate({ userId: userData.userId }, { $set: userData.KycData }, {
                new: true,
                upsert: true,
                runValidators: true
            });
            if (!Kyc) {
                throw new Error("Kyc Update Failed");
            }
            Kyc.KycStatus = "pending";
            await Kyc.save();
            user.KycStatus = "pending";
            await user.save();
            await this.AdminTransaction.create({
                userId: userData.userId,
                transactionId: Kyc._id,
                fullName: user.fullName,
                userName: user.userName,
                email: user.email,
                type: "kyc",
                isConfirmed: "pending",
            });
            await this.Notification.create({
                user: userData.userId,
                transactionId: Kyc._id,
                title: "kyc submitted and pending ",
                type: "kyc",
                message: "kyc is pending",
                priority: "high",
                path: kycLink,
                category: "kyc",
            });
            return {
                Kyc,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
}
exports.KycService = KycService;
