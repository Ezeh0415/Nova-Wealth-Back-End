import { AppConfig } from "../../../../config/Config";
import { NotificationModel, NotificationPriority, NotificationType } from "../../../Notification/Model/NotificationSchema";
import Referral from "../../../Referral/Model/Model";
import Wallet from "../../../Wallet/Model/WalletSchema";
import User, { IUser } from "../../Model/UserSchema";
import bcrypt from 'bcrypt';
import { nanoid } from "nanoid";
import { MailSender } from "../../../../Middleware/GmailSetup/Mailjet";
import { TokenService } from "../../../../Middleware/jwtConfig/GetJwtToken";
import { ResetTokenModel } from "../../Model/ResetToken";

interface SignUpDTO {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
    referralCode?: string;
}

export interface ProfileUpdate {
    userId: string,
    fullName: string,
    email: string,
    currentPassword?: string,
    newPassword?: string,
    bitcoin?: string,
    usdt?: string,
    ethereum?: string,
    tron?: string,
}

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

    public async SignUp(userData: SignUpDTO) {

        const {
            fullName,
            userName,
            email,
            password,
            ipAddress,
            userAgent,
            referralCode
        } = userData;
        try {
            // Check for existing user
            const existingUser = await this.user.findOne({
                $or: [
                    { email: userData.email },
                    { userName: userData.userName },
                ]
            });

            if (existingUser) {
                throw new Error("Credentials already in use");
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password as string, this.SALT_ROUNDS);

            //  Generate referral code for ALL users (moved outside the if block)
            const uniqueCode = nanoid(16);
            const newReferralCode = `${userData.userName}-${uniqueCode}`;
            const referralLinks = `${process.env.FRONTEND_URL}/Auth/signup?ref=${newReferralCode}`;

            // Create new user with ALL data at once
            const NewUser = new this.user({
                fullName: fullName,
                userName: userName,
                email: email,
                password: hashedPassword,
                ipAddress: ipAddress,
                userAgent: userAgent,
                referralCode: newReferralCode,
                referralLink: referralLinks,
            });

            // Process referral if provided

            let referralRecord = null;
            if (referralCode && referralCode.trim()) {
                const referrerUser = await this.user.findOne({
                    referralCode: referralCode.trim(),
                });

                if (referrerUser) {
                    NewUser.referredBy = referrerUser._id;

                    // Create referral record
                    referralRecord = new this.Referral({
                        referrer: referrerUser._id,
                        referrerUser: NewUser._id,
                        referralCodeUsed: referralCode.trim(),
                        status: "pending",
                        bonusAmount: this.REFERRAL_BONUS,
                        minDepositRequired: this.MIN_DEPOSIT_FOR_BONUS
                    });
                    await referralRecord.save();

                    // Notify referrer
                    await this.Notification.create([{
                        user: referrerUser._id,
                        type: NotificationType.REFERRAL,
                        title: "New Referral!",
                        message: `${NewUser.userName} signed up using your referral code. Bonus will be awarded after their first deposit of $${this.MIN_DEPOSIT_FOR_BONUS / 100}.`,
                        priority: NotificationPriority.MEDIUM,
                        category: NotificationType.REFERRAL,
                    }]);

                    // Notify new user about deposit
                    await this.Notification.create([{
                        user: NewUser._id,
                        type: NotificationType.DEPOSIT,
                        title: "Make Your First Deposit",
                        message: "Make your first deposit to start earning returns on your investment.",
                        priority: NotificationPriority.MEDIUM,
                        category: NotificationType.DEPOSIT,
                    }]);
                }
            }

            //  Save user ONCE with all data
            await NewUser.save();

            // Create wallet
            await this.wallet.create([{
                userId: NewUser._id,
                balance: 0,
                invBalance: 0,
                pendingWithdraw: 0,
                totalDeposits: 0,
                totalReturn: 0,
                pending: 0,
            }]);

            // Welcome notification
            await this.Notification.create([{
                user: NewUser._id,
                type: NotificationType.SIGNUP,
                title: "Welcome to Our Platform!",
                message: `Hello ${NewUser.fullName}, thank you for signing up!`,
                priority: NotificationPriority.LOW,
                category: NotificationType.SIGNUP,
            }]);

            // Send emails
            const link = `${this.config.FRONTEND_URL}/Auth/login`;
            await this.mailjet.sendWelcomeEmail(NewUser.email, NewUser.fullName, link);
            await this.mailjet.sendAdminWelcomEmail(
                this.config.ADMIN_EMAIL_USER,
                NewUser.fullName,
                NewUser.userName,
                NewUser.email,
                NewUser?.ipAddress as string,
                NewUser?.userAgent as string
            );

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
            };

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
            }).select('+password')


            if (!isExist) {
                throw new Error("invalid username or email");
            }

            const isPasswordCorrect = await bcrypt.compare(userData.password as string, isExist.password as string);
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



            const user = await this.user.findById(isExist._id);

            if (!user) {
                throw new Error("Login failed");
            }
            console.log("pass 7");
            const { password: _, ...safeUser } = user.toObject();

            return {
                safeUser,
                accessToken,
                refreshToken,
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

    public async profileUpdate(userData: ProfileUpdate) {
        try {
            const { userId, fullName, email, currentPassword, newPassword, bitcoin, usdt, ethereum, tron } = userData;

            const isExist = await this.user.findById(userId).select('+password');

            if (!isExist) {
                throw new Error("Error while finding user");
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword as string, isExist.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            let hashedPassword;

            if (newPassword && newPassword.trim() !== '') {
                // Check if new password is same as old
                const isSamePassword = await bcrypt.compare(newPassword, isExist.password);
                if (isSamePassword) {
                    throw new Error('New password cannot be the same as old password');
                }

                hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
            }

            const result = await this.user.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        fullName: fullName,
                        email: email,
                        // Only include password if it was provided
                        ...(hashedPassword && { password: hashedPassword }),
                        wallets: {
                            bitcoin: bitcoin,
                            usdt: usdt,
                            ethereum: ethereum,
                            tron: tron
                        },
                    }
                },
                {
                    new: true,           // Return updated document
                    runValidators: true  // Run schema validations
                }
            );

            return {
                result,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        }
    }
}