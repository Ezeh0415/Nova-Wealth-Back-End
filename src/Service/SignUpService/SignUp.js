const { nanoid } = require("nanoid");
const mailjet = require("../../Utili/NodeMailer");
const { welcomeTemplate } = require("../../Utili/WelcomeTamplate");
const { adminNotificationTemplate } = require("../../Utili/adminNotificationTemplate");

class SignUpService {
  constructor({
    UserModel,
    WalletModel,
    NotificationModel,
    ReferralModel,
    TransactionModel,
  }) {
    this.UserModel = UserModel;
    this.WalletModel = WalletModel;
    this.NotificationModel = NotificationModel;
    this.ReferralModel = ReferralModel;
    this.TransactionModel = TransactionModel;
    this.REFERRAL_BONUS = 1000; // 10 USD in cents
    this.MIN_DEPOSIT_FOR_BONUS = 5000; // 50 USD in cents
  }

  async signUp(userData) {
    const session = await this.UserModel.startSession();

    try {
      return await session.withTransaction(async () => {
        const {
          fullName,
          userName,
          email,
          password,
          referralCode,
          ipAddress,
          userAgent,
        } = userData;

        // 1. Validate required fields
        if (!fullName || !userName || !email || !password) {
          throw new Error("All fields are required");
        }

        // 2. Check for existing user (case-insensitive)
        const existingUser = await this.UserModel.findOne({
          $or: [
            { userName: userName},
            { email: email},
          ],
        }).session(session);

        if (existingUser) {
          if (existingUser.userName.toLowerCase() === userName.toLowerCase()) {
            throw new Error("Username already exists");
          }
          throw new Error("Email already exists");
        }

        // 3. Create new user
        const newUser = new this.UserModel({
          fullName,
          userName,
          email: email.toLowerCase(),
          password,
          ipAddress,
          userAgent,
        });

        await newUser.save({ session });

        let referrerUser = null;
        let referralRecord = null;

        // 4. Handle referral if provided
        if (referralCode && referralCode.trim()) {
          referrerUser = await this.UserModel.findOne({
            referralCode: referralCode.trim(),
          }).session(session);

          if (referrerUser) {
            newUser.referredBy = referrerUser._id;
            await newUser.save({ session });

            referralRecord = new this.ReferralModel({
              referrer: referrerUser._id,
              referredUser: newUser._id,
              referralCodeUsed: referralCode.trim(),
              status: "pending",
              bonusAmount: this.REFERRAL_BONUS,
              minDepositRequired: this.MIN_DEPOSIT_FOR_BONUS,
            });
            await referralRecord.save({ session });

            // Notify referrer
            await this.NotificationModel.create(
              [{
                user: referrerUser._id,
                type: "referral",
                title: "New Referral!",
                message: `${newUser.userName} signed up using your referral code. Bonus will be awarded after their first deposit of \[ {this.MIN_DEPOSIT_FOR_BONUS / 100}.`,
                priority: "medium",
                category: "referral",
              }],
              { session }
            );

            // Notify new user
            await this.NotificationModel.create(
              [{
                user: newUser._id,
                type: "referral",
                title: "Referral Bonus Available!",
                message: `Make your first deposit of \]{this.MIN_DEPOSIT_FOR_BONUS / 100} or more to unlock your referrer's bonus!`,
                priority: "medium",
                category: "referral",
              }],
              { session }
            );
          }
        }

        // 5. Create wallet
        await this.WalletModel.create(
          [{
            userId: newUser._id,
            balance: 0,
            invBalance: 0,
            pendingWithdraw: 0,
            totalDeposits: 0,
            totalReturn: 0,
            pending: 0,
          }],
          { session }
        );

        // 6. Generate referral code & link
        const uniqueCode = nanoid(16); // Generate a unique referral code
        const newReferralCode = `${newUser.userName}-${uniqueCode}`;

        const referralLinks = `${process.env.FRONTEND_URL}/signup?ref=${newReferralCode}`;

        newUser.referralCode = newReferralCode;
        newUser.referralLink = referralLinks;

        await newUser.save({ session });

        // 7. Welcome notification
        await this.NotificationModel.create(
          [{
            user: newUser._id,
            type: "signup",
            title: "Welcome to Our Platform!",
            message: `Hello ${newUser.fullName}, thank you for signing up!`,
            priority: "low",
            category: "signup",
          }],
          { session }
        );

        // 8. Send welcome email to user
        const loginLink = `${process.env.FRONTEND_URL}/login`;

        try {
          const result = await mailjet
            .post("send", { version: "v3.1" })
            .request({
              Messages: [
                {
                  From: {
                    Email: process.env.EMAIL_USER,
                    Name: "Althworld Global",
                  },
                  To: [{ Email: newUser.email }],
                  Subject: `New User Registration: ${newUser.userName}`,
                  HTMLPart: welcomeTemplate(newUser.fullName, loginLink),
                },
              ],
            });

          console.log("Welcome email sent", {
            to: newUser.email,
            status: result.response?.status,
            messageId: result.body?.Messages?.[0]?.To?.[0]?.MessageID,
          });
        } catch (emailErr) {
          console.error("Failed to send welcome email:", {
            to: newUser.email,
            statusCode: emailErr.statusCode,
            message: emailErr.message,
          });
          const err = new Error("Failed to send welcome email");
          err.code = "EMAIL_SEND_FAILED";
          err.status = 500;
          err.details = { mailjetError: emailErr.message };
          throw err;
        }

        // 9. Send admin notification email
        try {
          const result = await mailjet
            .post("send", { version: "v3.1" })
            .request({
              Messages: [
                {
                  From: {
                    Email: process.env.EMAIL_USER,
                    Name: "Althworld Global",
                  },
                  To: [{ Email: process.env.ADMIN_EMAIL_USER }],
                  Subject: `New User Registration: ${newUser.userName}`,
                  HTMLPart: adminNotificationTemplate({
                    fullName: newUser.fullName,
                    userName: newUser.userName,
                    email: newUser.email,
                    ipAddress: newUser.ipAddress || "N/A",
                    userAgent: newUser.userAgent || "N/A",
                  }),
                },
              ],
            });

          console.log("Admin notification email sent", {
            to: process.env.ADMIN_EMAIL_USER,
            status: result.response?.status,
            messageId: result.body?.Messages?.[0]?.To?.[0]?.MessageID,
          });
        } catch (adminEmailErr) {
          console.error("Failed to send admin notification email:", {
            statusCode: adminEmailErr.statusCode,
            message: adminEmailErr.message,
          });
          const err = new Error("Failed to send admin notification email");
          err.code = "EMAIL_SEND_FAILED";
          err.status = 500;
          err.details = { mailjetError: adminEmailErr.message };
          throw err;
        }

        // 10. Return sanitized user data
        return {
          id: newUser._id,
          fullName: newUser.fullName,
          userName: newUser.userName,
          email: newUser.email,
          referralCode: newUser.referralCode,
          referredBy: newUser.referredBy,
          hasReferralBonus: !!referralRecord,
          minDepositForBonus: this.MIN_DEPOSIT_FOR_BONUS,
          createdAt: newUser.createdAt,
        };
      });
    } catch (error) {
      console.error("Signup transaction failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = SignUpService;
