import { NotificationModel, NotificationPriority, NotificationType } from "../../../Notification/NotificationSchema";
import Referral from "../../../Referral/Model";
import Wallet from "../../../Wallet/WalletSchema";
import User, { IUser } from "../../Model/UserSchema";
import bcrypt from 'bcryptJs';

export class Authentication {
    private static instance: Authentication;
    private user = User;
    private Referral = Referral;
    private wallet = Wallet;
    private Notification = NotificationModel;
    private readonly SALT_ROUNDS = 10;
    private readonly REFERRAL_BONUS = 1000;
    private readonly MIN_DEPOSIT_FOR_BONUS = 5000;

    public constructor() { };

    public static getInstance(): Authentication {
        if (!Authentication.instance) {
            Authentication.instance = new Authentication();
        }
        return Authentication.instance;
    }

    public async SignUp(userData: Partial<IUser>) {
        const session = await this.user.startSession();

        try {
            return await session.withTransaction(async () => {
                const existingUser = await this.user.findOne({
                    $or: [
                        { email: userData.email },
                        { userName: userData.userName },
                    ]
                }).session(session);

                if (existingUser) {
                    throw new Error("credentials Already in use");
                }

                // hash password 
                const hashedPassword = await bcrypt.hash(userData.password as string, this.SALT_ROUNDS);

                const NewUser = new this.user({
                    fullName: userData.fullName,
                    userName: userData.userName,
                    email: userData.email,
                    password: hashedPassword,
                    ipAddress: userData.ipAddress,
                    userAgent: userData.userAgent,
                });

                await NewUser.save({ session });

                const referralCode = userData.referralCode;
                let referrerUser = null;
                let referralRecord = null;

                if (referralCode && referralCode.trim()) {
                    referrerUser = await this.user.findOne({
                        referralCode: referralCode.trim(),
                    }).session(session);

                    if (referrerUser) {
                        NewUser.referredBy = referrerUser._id;
                        await NewUser.save({ session });

                        //add referal model
                        referralRecord = new this.Referral({
                            referrer: referrerUser._id,
                            referrerUser: NewUser._id,
                            referralCodeUsed: referralCode.trim(),
                            status: "pending",
                            bonusAmount: this.REFERRAL_BONUS,
                            minDepositRequired: this.MIN_DEPOSIT_FOR_BONUS
                        });
                        await referralRecord.save({ session });

                        await this.Notification.create(
                            [{
                                user: referrerUser._id,
                                type: NotificationType.REFERRAL,
                                title: "New Referral!",
                                message: `${NewUser.userName} signed up using your referral code. Bonus will be awarded after their first deposit of \[ {this.MIN_DEPOSIT_FOR_BONUS / 100}.`,
                                priority: NotificationPriority.MEDIUM,
                                category: NotificationType.REFERRAL,
                            }],
                            { session }
                        );

                        await this.Notification.create(
                            [{
                                user: referrerUser._id,
                                type: NotificationType.REFERRAL,
                                title: "Referral Bonus Available!",
                                message: `Make your first deposit of \]{this.MIN_DEPOSIT_FOR_BONUS / 100} or more to unlock your referrer's bonus!`,
                                priority: NotificationPriority.MEDIUM,
                                category: NotificationType.REFERRAL,
                            }],
                            { session }
                        );
                    }

                    await this.wallet.create(
                        [{
                            userId: NewUser._id,
                            balance: 0,
                            invBalance: 0,
                            pendingWithdraw: 0,
                            totalDeposits: 0,
                            totalReturn: 0,
                            pending: 0,
                        }], { session }
                    )
                }




            });
        } catch (error) {
            throw error;
        } finally {
            await session.endSession();
        }
    }
}