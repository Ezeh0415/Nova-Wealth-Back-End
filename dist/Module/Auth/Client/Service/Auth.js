"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authentication = void 0;
const Config_1 = require("../../../../config/Config");
const NotificationSchema_1 = require("../../../Notification/Model/NotificationSchema");
const Model_1 = __importDefault(require("../../../Referral/Model/Model"));
const WalletSchema_1 = __importDefault(require("../../../Wallet/Model/WalletSchema"));
const UserSchema_1 = __importDefault(require("../../Model/UserSchema"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const nanoid_1 = require("nanoid");
const Mailjet_1 = require("../../../../Middleware/GmailSetup/Mailjet");
const GetJwtToken_1 = require("../../../../Middleware/jwtConfig/GetJwtToken");
const ResetToken_1 = require("../../Model/ResetToken");
class Authentication {
    constructor() {
        this.user = UserSchema_1.default;
        this.Referral = Model_1.default;
        this.wallet = WalletSchema_1.default;
        this.Notification = NotificationSchema_1.NotificationModel;
        this.ResetToken = ResetToken_1.ResetTokenModel;
        this.SALT_ROUNDS = 10;
        this.REFERRAL_BONUS = 1000;
        this.MIN_DEPOSIT_FOR_BONUS = 5000;
        this.mailjet = Mailjet_1.MailSender.getInstance();
        this.config = Config_1.AppConfig.getInstance();
        this.TokenService = GetJwtToken_1.TokenService.getInstance();
    }
    ;
    static getInstance() {
        if (!Authentication.instance) {
            Authentication.instance = new Authentication();
        }
        return Authentication.instance;
    }
    async SignUp(userData) {
        const { fullName, userName, email, password, bitcoin, usdt, ipAddress, userAgent, referralCode } = userData;
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
            const hashedPassword = await bcrypt_1.default.hash(password, this.SALT_ROUNDS);
            //  Generate referral code for ALL users (moved outside the if block)
            const uniqueCode = (0, nanoid_1.nanoid)(16);
            const newReferralCode = `${userData.userName}-${uniqueCode}`;
            const referralLinks = `${process.env.FRONTEND_URL}/Auth/signup?ref=${newReferralCode}`;
            // Create new user with ALL data at once
            const NewUser = new this.user({
                fullName: fullName,
                userName: userName,
                email: email,
                password: hashedPassword,
                wallets: {
                    bitcoin: bitcoin || "", //  Now using the extracted fields
                    usdt: usdt || "" //  Now using the extracted fields
                },
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
                            type: NotificationSchema_1.NotificationType.REFERRAL,
                            title: "New Referral!",
                            message: `${NewUser.userName} signed up using your referral code. Bonus will be awarded after their first deposit of $${this.MIN_DEPOSIT_FOR_BONUS / 100}.`,
                            priority: NotificationSchema_1.NotificationPriority.MEDIUM,
                            category: NotificationSchema_1.NotificationType.REFERRAL,
                        }]);
                    // Notify new user about deposit
                    await this.Notification.create([{
                            user: NewUser._id,
                            type: NotificationSchema_1.NotificationType.DEPOSIT,
                            title: "Make Your First Deposit",
                            message: "Make your first deposit to start earning returns on your investment.",
                            priority: NotificationSchema_1.NotificationPriority.MEDIUM,
                            category: NotificationSchema_1.NotificationType.DEPOSIT,
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
                    type: NotificationSchema_1.NotificationType.SIGNUP,
                    title: "Welcome to Our Platform!",
                    message: `Hello ${NewUser.fullName}, thank you for signing up!`,
                    priority: NotificationSchema_1.NotificationPriority.LOW,
                    category: NotificationSchema_1.NotificationType.SIGNUP,
                }]);
            // Send emails
            const link = `${this.config.FRONTEND_URL}/Auth/login`;
            await this.mailjet.sendWelcomeEmail(NewUser.email, NewUser.fullName, link);
            await this.mailjet.sendAdminWelcomEmail(this.config.ADMIN_EMAIL_USER, NewUser.fullName, NewUser.userName, NewUser.email, NewUser?.ipAddress, NewUser?.userAgent);
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        }
    }
    async Login(userData) {
        try {
            const isExist = await this.user.findOne({
                $or: [
                    { userName: userData.userName },
                    { email: userData.userName }
                ]
            }).select('+password');
            if (!isExist) {
                throw new Error("invalid username or email");
            }
            const isPasswordCorrect = await bcrypt_1.default.compare(userData.password, isExist.password);
            if (!isPasswordCorrect) {
                throw new Error("invalid password");
            }
            const accessToken = await this.TokenService.getJwtToken(isExist._id, isExist.email);
            const refreshToken = await this.TokenService.getRefreshJwtToken(isExist._id, isExist.email);
            await this.user.findOneAndUpdate({ _id: isExist._id }, { $set: { refreshToken: refreshToken } }, { new: true });
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
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        }
    }
    async forgotPassword(userData) {
        try {
            //  Find user with session
            const isExist = await this.user.findOne({
                email: userData?.email
            });
            if (!isExist) {
                throw new Error("Reset link has been sent");
            }
            ;
            //  Count recent reset requests with session
            const recentResetCount = await this.ResetToken.countDocuments({
                userId: isExist._id,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            });
            if (recentResetCount >= 3) {
                throw new Error("Too many reset requests. Please try again later.");
            }
            ;
            // Generate plain token
            const plainToken = await this.TokenService.getRefreshJwtToken(isExist._id, isExist.email);
            // Hash the token
            const hashedToken = await bcrypt_1.default.hash(plainToken, this.SALT_ROUNDS);
            //  Create reset token with session
            await this.ResetToken.create([{
                    userId: isExist._id,
                    token: hashedToken,
                    expires: new Date(Date.now() + 3600000), // 1 hour
                    ipAddress: userData.ipAddress,
                    userAgent: userData.userAgent,
                }]);
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        }
    }
    async resetPassword(token, password) {
        try {
            let decoded;
            try {
                decoded = await this.TokenService.verifyRefreshToken(token);
            }
            catch (error) {
                throw new Error("Invalid or expired reset link");
            }
            const resetToken = await this.ResetToken.find({
                userId: decoded.decoded?.userId,
                used: { $in: ["", "false", null] },
            })
                .sort({ createdAt: -1 });
            let resetTokens;
            for (const token of resetToken) {
                if (new Date(token.expires).getTime() > Date.now()) {
                    resetTokens = token;
                    break;
                }
            }
            if (!resetTokens) {
                throw new Error("invalid or expired reset link");
            }
            const isValid = await bcrypt_1.default.compare(decoded.decoded?.token, resetTokens.token);
            if (!isValid) {
                throw new Error("Invalid reset token");
            }
            const user = await this.user.findById(decoded.decoded?.userId);
            if (!user) {
                throw new Error("error getting user");
            }
            const isSamePassword = await bcrypt_1.default.compare(password, user.password);
            if (isSamePassword) {
                throw new Error("you can not use old password");
            }
            const hashPassword = await bcrypt_1.default.hash(password, this.SALT_ROUNDS);
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        }
    }
    async profileUpdate(userData) {
        try {
            const { userId, fullName, email, currentPassword, newPassword, bitcoin, usdt, ethereum, tron } = userData;
            const isExist = await this.user.findById(userId).select('+password');
            if (!isExist) {
                throw new Error("Error while finding user");
            }
            // Verify current password
            const isCurrentPasswordValid = await bcrypt_1.default.compare(currentPassword, isExist.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            let hashedPassword;
            if (newPassword && newPassword.trim() !== '') {
                // Check if new password is same as old
                const isSamePassword = await bcrypt_1.default.compare(newPassword, isExist.password);
                if (isSamePassword) {
                    throw new Error('New password cannot be the same as old password');
                }
                hashedPassword = await bcrypt_1.default.hash(newPassword, this.SALT_ROUNDS);
            }
            const result = await this.user.findByIdAndUpdate(userId, {
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
            }, {
                new: true, // Return updated document
                runValidators: true // Run schema validations
            });
            return {
                result,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        }
    }
}
exports.Authentication = Authentication;
