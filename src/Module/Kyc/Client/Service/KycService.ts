import User from "../../../Auth/Model/UserSchema";
import { NotificationModel } from "../../../Notification/Model/NotificationSchema";
import AdminTransaction from "../../../Transaction/Model/Admin/AdminTransction";
import KYC from "../../Model/KycSchema";
const kycLink = `${process.env.FRONTEND_URL}/Kyc`;

interface verifyKyc {
    userId: string,
    KycData: any,
}

export class KycService {
    private static instance: KycService;
    private user = User;
    private Kyc = KYC;
    private AdminTransaction = AdminTransaction;
    private Notification = NotificationModel;

    private constructor() { };

    public static getInstance(): KycService {
        if (!KycService.instance) {
            KycService.instance = new KycService();
        }

        return KycService.instance;
    }


    public async VerifyKyc(userData: verifyKyc) {
        try {
            const user = await this.user.findById(userData.userId);

            if (!user) {
                throw new Error("User Not Found");
            };

            const Kyc = await this.Kyc.findByIdAndUpdate(
                { userId: userData.userId },
                { $set: userData.KycData },
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                },
            );

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
            })

            await this.Notification.create({
                user: userData.userId,
                transactionId: Kyc._id,
                title: "kyc submitted and pending ",
                type: "kyc",
                message: "kyc is pending",
                priority: "high",
                path: kycLink,
                category: "kyc",
            })

            return {
                Kyc,
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }

}