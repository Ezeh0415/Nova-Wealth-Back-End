import { AppConfig } from "../../../../config/Config";
import { NotificationModel, NotificationPriority, NotificationType } from "../../../Notification/NotificationSchema";
import Referral from "../../../Referral/Model";
import Wallet from "../../../Wallet/WalletSchema";
import User, { IUser } from "../../Model/UserSchema";
import bcrypt from 'bcryptJs';
import { nanoid } from "nanoid";
import { MailSender } from "../../../../Middleware/GmailSetup/Mailjet";
import mongoose from "mongoose";
import { TokenService } from "../../../../Middleware/jwtConfig/GetJwtToken";
import { ResetTokenModel } from "../../Model/ResetToken";

export class Authentication {
    private static instance: Authentication;
    private user = User;
    private Referral = Referral;
    private wallet = Wallet;
    private Notification = NotificationModel;
    private ResetToken = ResetTokenModel;
    private readonly SALT_ROUNDS = 10;
    private readonly REFERRAL_BONUS = 1000;
    private readonly MIN_DEPOSIT_FOR_BONUS = 5000;
    private config: AppConfig;
    private mailjet = MailSender.getInstance();
    private TokenService: TokenService;

    public constructor() {
        this.config = AppConfig.getInstance();
        this.TokenService = TokenService.getInstance();
    };

    public static getInstance(): Authentication {
        if (!Authentication.instance) {
            Authentication.instance = new Authentication();
        }
        return Authentication.instance;
    }

    public async SignUp(userData: Partial<IUser>) {
        const session = await mongoose.connection.startSession();

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
                    );

                    const uniqueCode = nanoid(16);
                    const newReferralCode = `${NewUser.userName}-${uniqueCode}`;

                    const referralLinks = `${process.env.FRONTEND_URL}/signup?ref=${newReferralCode}`;

                    NewUser.referralCode = newReferralCode;
                    NewUser.referralLink = referralLinks;

                    await NewUser.save({ session });
                }

                await this.Notification.create(
                    [{
                        user: NewUser._id,
                        type: NotificationType.SIGNUP,
                        title: "Welcome to Our Platform!",
                        message: `Hello ${NewUser.fullName}, thank you for signing up!`,
                        priority: NotificationPriority.LOW,
                        category: NotificationType.SIGNUP,
                    }],
                    { session }
                );

                const link = `${this.config.FRONTEND_URL}/login`;


                await this.mailjet.sendWelcomeEmail(NewUser.email, NewUser.fullName, link);

                await this.mailjet.sendAdminWelcomEmail(this.config.ADMIN_EMAIL_USER, NewUser.fullName, NewUser.userName, NewUser.email, NewUser.ipAddress, NewUser.userAgent);

                return {
                    id: NewUser._id,
                    fullName: NewUser.fullName,
                    userName: NewUser.userName,
                    email: NewUser.email,
                    referralCode: NewUser.referralCode,
                    referredBy: NewUser.referredBy,
                    hasReferralBonus: !!referralRecord,
                    minDepositForBonus: this.MIN_DEPOSIT_FOR_BONUS,
                    createdAt: NewUser.createdAt,
                }

            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        } finally {
            await session.endSession();
        }
    }

    public async Login(userData: Partial<IUser>) {
        const session = await mongoose.connection.startSession();
        try {
            await session.withTransaction(async () => {
                const isExist = await this.user.findOne({
                    $or: [
                        { userName: userData.userName },
                        { email: userData.userName }
                    ]
                })

                if (!isExist) {
                    throw new Error("invalid username or email");
                }

                const isPasswordCorrect = await bcrypt.compare(userData.password as string, isExist.password);
                if (!isPasswordCorrect) {
                    throw new Error("invalid password");
                }

                const accessToken = await this.TokenService.getJwtToken(isExist._id, isExist.email);
                const refreshToken = await this.TokenService.getRefreshJwtToken(isExist._id, isExist.email);

                await this.user.findOneAndUpdate(
                    { _id: isExist._id },
                    { $set: { refreshToken: refreshToken } },
                    { new: true }
                )

                const { password: _, refreshToken: __, ...safeUser } = isExist.toObject();

                return {
                    safeUser,
                    accessToken,
                }

            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        } finally {
            await session.endSession();
        }
    }

    public async forgotPassword(userData: Partial<IUser>) {
        const session = await mongoose.connection.startSession();
        try {
            await session.withTransaction(async () => {
                const isExist = await this.user.findOne({ email: userData.email });
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        } finally {
            await session.endSession();
        }
    }
}