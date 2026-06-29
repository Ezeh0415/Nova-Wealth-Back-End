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

        console.log(userData)

        try {

            const existingUser = await this.user.findOne({
                $or: [
                    { email: userData.email },
                    { userName: userData.userName },
                ]
            })

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

            await NewUser.save();

            const referralCode = userData.referralCode;
            let referrerUser = null;
            let referralRecord = null;

            if (referralCode && referralCode.trim()) {
                referrerUser = await this.user.findOne({
                    referralCode: referralCode.trim(),
                });

                if (referrerUser) {
                    NewUser.referredBy = referrerUser._id;
                    await NewUser.save();

                    //add referal model
                    referralRecord = new this.Referral({
                        referrer: referrerUser._id,
                        referrerUser: NewUser._id,
                        referralCodeUsed: referralCode.trim(),
                        status: "pending",
                        bonusAmount: this.REFERRAL_BONUS,
                        minDepositRequired: this.MIN_DEPOSIT_FOR_BONUS
                    });
                    await referralRecord.save();

                    await this.Notification.create(
                        [{
                            user: referrerUser._id,
                            type: NotificationType.REFERRAL,
                            title: "New Referral!",
                            message: `${NewUser.userName} signed up using your referral code. Bonus will be awarded after their first deposit of \[ {this.MIN_DEPOSIT_FOR_BONUS / 100}.`,
                            priority: NotificationPriority.MEDIUM,
                            category: NotificationType.REFERRAL,
                        }],
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
                    }],
                );

                const uniqueCode = nanoid(16);
                const newReferralCode = `${NewUser.userName}-${uniqueCode}`;

                const referralLinks = `${process.env.FRONTEND_URL}/signup?ref=${newReferralCode}`;

                NewUser.referralCode = newReferralCode;
                NewUser.referralLink = referralLinks;

                await NewUser.save();
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

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        }
    }

    public async Login(userData: Partial<IUser>) {
        try {
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

            const { password: _, ...safeUser } = isExist.toObject();

            return {
                safeUser,
                accessToken,
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        }
    }

    public async forgotPassword(userData: Partial<IUser>) {

        try {
            //  Find user with session
            const isExist = await this.user.findOne({
                email: userData?.email
            });

            if (!isExist) {
                throw new Error("Reset link has been sent");
            };

            //  Count recent reset requests with session
            const recentResetCount = await this.ResetToken.countDocuments({
                userId: isExist._id,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            });

            if (recentResetCount >= 3) {
                throw new Error("Too many reset requests. Please try again later.");
            };

            // Generate plain token
            const plainToken = await this.TokenService.getRefreshJwtToken(isExist._id, isExist.email);

            // Hash the token
            const hashedToken = await bcrypt.hash(plainToken, this.SALT_ROUNDS);

            //  Create reset token with session
            await this.ResetToken.create(
                [{
                    userId: isExist._id,
                    token: hashedToken,
                    expires: new Date(Date.now() + 3600000), // 1 hour
                    ipAddress: userData.ipAddress,
                    userAgent: userData.userAgent,
                }],
            );

            //  Delete old/used tokens for this user (optional cleanup)
            await this.ResetToken.deleteMany({
                userId: isExist._id,
                $or: [
                    { used: "true" },
                    { expires: { $lt: new Date() } }
                ]
            });

            const link = `${this.config.FRONTEND_URL}resetPassword?token=${plainToken}&key=${this.config.API_KEY}`;

            // Send email (no session needed - this is external)
            const mailSend = await this.mailjet.sendOtpEmail(isExist.email, link);

            return {
                mailSend,
                expiresIn: "1 hour",
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        }
    }

    public async resetPassword(token: string, password: string) {

        try {

            let decoded;
            try {
                decoded = await this.TokenService.verifyRefreshToken(token);
            } catch (error) {
                throw new Error("Invalid or expired reset link");
            }

            const resetToken = await this.ResetToken.find({
                userId: decoded.decoded?.userId,
                used: { $in: ["", "false", null] },
            })
                .sort({ createdAt: -1 })


            let resetTokens;

            for (const token of resetToken) {
                if (new Date(token.expires).getTime() > Date.now()) {
                    resetTokens = token
                    break;
                }
            }

            if (!resetTokens) {
                throw new Error("invalid or expired reset link");
            }

            const isValid = await bcrypt.compare(decoded.decoded?.token, resetTokens.token);

            if (!isValid) {
                throw new Error("Invalid reset token");
            }

            const user = await this.user.findById(decoded.decoded?.userId);

            if (!user) {
                throw new Error("error getting user");
            }

            const isSamePassword = await bcrypt.compare(password, user.password);

            if (isSamePassword) {
                throw new Error("you can not use old password");
            }

            const hashPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

            user.password = hashPassword;
            user.passwordChangedAt = new Date(); // Track when password was changed
            await user.save();

            // 9. MARK TOKEN AS USED
            if (resetTokens) {
                resetTokens.used = true;
                resetTokens.usedAt = new Date();
                await resetTokens.save();
            }

            await this.mailjet.sendPasswordChangeEmail(user.email, user.userName, user.email);

            return {
                message: "password has been reset successfully"
            };


        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        }
    }
}