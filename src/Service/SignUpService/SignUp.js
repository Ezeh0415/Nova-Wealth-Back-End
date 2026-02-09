const { transporter } = require("../../Utili/NodeMailer");
const { welcomeTemplate } = require("../../Utili/WelcomeTamplate");

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
        const { fullName, userName, email, password, referralCode } = userData;
        console.log(referralCode);

        // 1️⃣ Validate fields
        if (!fullName || !userName || !email || !password) {
          throw new Error("All fields are required");
        }

        // 2️⃣ Check if user exists
        const existingUser = await this.UserModel.findOne({
          $or: [
            { userName: { $regex: new RegExp(`^${userName}$`, "i") } },
            { email: { $regex: new RegExp(`^${email}$`, "i") } },
          ],
        }).session(session);

        if (existingUser) {
          if (existingUser.userName.toLowerCase() === userName.toLowerCase()) {
            throw new Error("Username already exists");
          }
          throw new Error("Email already exists");
        }

        // 3️⃣ Create new user
        const newUser = new this.UserModel({
          fullName,
          userName: userName,
          email: email.toLowerCase(),
          password,
        });

        // 4️⃣ Save user first to get _id
        await newUser.save({ session });

        let referrerUser = null;
        let referralRecord = null;

        // 5️⃣ Handle referral if valid code (NO BONUS YET)
        if (referralCode && referralCode.trim() !== "") {
          referrerUser = await this.UserModel.findOne({
            referralCode: referralCode.trim(),
          }).session(session);

          if (referrerUser) {
            // Update user with referrer
            newUser.referredBy = referrerUser._id;
            await newUser.save({ session });

            // Create referral record with PENDING status
            referralRecord = new this.ReferralModel({
              referrer: referrerUser._id,
              referredUser: newUser._id,
              referralCodeUsed: referralCode.trim(),
              status: "pending", // Will change to "eligible" after deposit
              bonusAmount: this.REFERRAL_BONUS,
              minDepositRequired: this.MIN_DEPOSIT_FOR_BONUS,
            });
            await referralRecord.save({ session });

            // Send notification to referrer
            const referrerNotification = new this.NotificationModel({
              user: referrerUser._id,
              type: "referral",
              title: "New Referral!",
              message: `${newUser.userName} signed up using your referral code. Bonus will be awarded after their first deposit of $${this.MIN_DEPOSIT_FOR_BONUS / 100}.`,
              priority: "medium",
              category: "referral",
            });
            await referrerNotification.save({ session });

            // Send notification to new user
            const userNotification = new this.NotificationModel({
              user: newUser._id,
              type: "referral",
              title: "Referral Bonus Available!",
              message: `Make your first deposit of $${this.MIN_DEPOSIT_FOR_BONUS / 100} or more to unlock your referrer's bonus!`,
              priority: "medium",
              category: "referral",
            });
            await userNotification.save({ session });
          }
        }

        // 6️⃣ Create wallet (NO BONUS ADDED HERE)
        await this.WalletModel.create(
          [
            {
              userId: newUser._id,
              balance: 0,
              invBalance: 0,
              pendingWithdraw: 0,
              totalDeposits: 0,
              totalReturn: 0,
              pending: 0,
            },
          ],
          { session },
        );

        // 7️⃣ Create welcome notification
        const welcomeNotification = new this.NotificationModel({
          user: newUser._id,
          type: "signup",
          title: "Welcome to Our Platform!",
          message: `Hello ${newUser.fullName}, thank you for signing up!`,
          priority: "low",
          category: "signup",
        });
        await welcomeNotification.save({ session });

        // 8️⃣. SEND RESET EMAIL
        const link = `${process.env.FRONTEND_URL}/login`;
        try {
          await transporter.sendMail({
            from: `"AlthWorld" <${process.env.EMAIL_USER}>`,
            to: newUser.email,
            subject: `welcome to AlthWorld Global ${newUser.userName}`,
            html: welcomeTemplate(newUser.fullName, link), // Uses email template with reset button
          });
        } catch (err) {
          throw new Error("Failed to send OTP email");
        }

        // 9 Return sanitized data
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
      console.error("Signup error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = SignUpService;
