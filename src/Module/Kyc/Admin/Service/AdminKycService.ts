import mongoose from "mongoose";
import User from "../../../Auth/Model/UserSchema";
import { NotificationModel } from "../../../Notification/Model/NotificationSchema";
import AdminTransaction, { AdminTransactionConfirmation } from "../../../Transaction/Model/Admin/AdminTransction";
import KYC from "../../Model/KycSchema";
const kycLink = `${process.env.FRONTEND_URL}/Kyc`;

interface IConfirmKyc {
    userId: string | mongoose.Types.ObjectId,
    KycId: string | mongoose.Types.ObjectId,
}

export class AdminKycService {
    private static instance: AdminKycService;
    private kyc = KYC;
    private user = User;
    private Notification = NotificationModel;
    private adminTransaction = AdminTransaction;

    private constructor() { };

    public static getInstance(): AdminKycService {
        if (!AdminKycService.instance) {
            AdminKycService.instance = new AdminKycService();
        }

        return AdminKycService.instance;
    }

    public async ConfirmKyc(userData: IConfirmKyc) {
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

            adminTransaction.isConfirmed = AdminTransactionConfirmation.TRUE;
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
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }

    public async CancelKyc(userData: IConfirmKyc) {
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

            adminTransaction.isConfirmed = AdminTransactionConfirmation.FAILED;
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
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
}