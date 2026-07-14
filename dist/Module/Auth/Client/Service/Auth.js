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
const bcryptJs_1 = __importDefault(require("bcryptJs"));
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
        try {
            const existingUser = await this.user.findOne({
                $or: [
                    { email: userData.email },
                    { userName: userData.userName },
                ]
            });
            if (existingUser) {
                throw new Error("credentials Already in use");
            }
            // hash password 
            const hashedPassword = await bcryptJs_1.default.hash(userData.password, this.SALT_ROUNDS);
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
                    await this.Notification.create([{
                            user: referrerUser._id,
                            type: NotificationSchema_1.NotificationType.REFERRAL,
                            title: "New Referral!",
                            message: `${NewUser.userName} signed up using your referral code. Bonus will be awarded after their first deposit of \[ {this.MIN_DEPOSIT_FOR_BONUS / 100}.`,
                            priority: NotificationSchema_1.NotificationPriority.MEDIUM,
                            category: NotificationSchema_1.NotificationType.REFERRAL,
                        }]);
                    await this.Notification.create([{
                            user: referrerUser._id,
                            type: NotificationSchema_1.NotificationType.REFERRAL,
                            title: "Referral Bonus Available!",
                            message: `Make your first deposit of \]{this.MIN_DEPOSIT_FOR_BONUS / 100} or more to unlock your referrer's bonus!`,
                            priority: NotificationSchema_1.NotificationPriority.MEDIUM,
                            category: NotificationSchema_1.NotificationType.REFERRAL,
                        }]);
                }
                await this.wallet.create([{
                        userId: NewUser._id,
                        balance: 0,
                        invBalance: 0,
                        pendingWithdraw: 0,
                        totalDeposits: 0,
                        totalReturn: 0,
                        pending: 0,
                    }]);
                const uniqueCode = (0, nanoid_1.nanoid)(16);
                const newReferralCode = `${NewUser.userName}-${uniqueCode}`;
                const referralLinks = `${process.env.FRONTEND_URL}/signup?ref=${newReferralCode}`;
                NewUser.referralCode = newReferralCode;
                NewUser.referralLink = referralLinks;
                await NewUser.save();
            }
            await this.Notification.create([{
                    user: NewUser._id,
                    type: NotificationSchema_1.NotificationType.SIGNUP,
                    title: "Welcome to Our Platform!",
                    message: `Hello ${NewUser.fullName}, thank you for signing up!`,
                    priority: NotificationSchema_1.NotificationPriority.LOW,
                    category: NotificationSchema_1.NotificationType.SIGNUP,
                }]);
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
            });
            if (!isExist) {
                throw new Error("invalid username or email");
            }
            const isPasswordCorrect = await bcryptJs_1.default.compare(userData.password, isExist.password);
            if (!isPasswordCorrect) {
                throw new Error("invalid password");
            }
            const accessToken = await this.TokenService.getJwtToken(isExist._id, isExist.email);
            const refreshToken = await this.TokenService.getRefreshJwtToken(isExist._id, isExist.email);
            await this.user.findOneAndUpdate({ _id: isExist._id }, { $set: { refreshToken: refreshToken } }, { new: true });
            const { password: _, ...safeUser } = isExist.toObject();
            return {
                safeUser,
                accessToken,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`login failed: ${errorMessage}`);
        }
    }
    async forgotPassword(userData) {
        console.log(userData);
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
            const hashedToken = await bcryptJs_1.default.hash(plainToken, this.SALT_ROUNDS);
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
            const isValid = await bcryptJs_1.default.compare(decoded.decoded?.token, resetTokens.token);
            if (!isValid) {
                throw new Error("Invalid reset token");
            }
            const user = await this.user.findById(decoded.decoded?.userId);
            if (!user) {
                throw new Error("error getting user");
            }
            const isSamePassword = await bcryptJs_1.default.compare(password, user.password);
            if (isSamePassword) {
                throw new Error("you can not use old password");
            }
            const hashPassword = await bcryptJs_1.default.hash(password, this.SALT_ROUNDS);
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
}
exports.Authentication = Authentication;
