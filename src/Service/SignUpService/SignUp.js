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
  }

  async signUp(userData) {
    const session = await this.UserModel.startSession();

    try {
      return await session.withTransaction(async () => {
        const { fullName, userName, email, password, referral } = userData;

        console.log("1️⃣ Validate fields");
        // 1️⃣ Validate fields
        if (!fullName || !userName || !email || !password) {
          throw new Error("All fields are required");
        }

        console.log("2️⃣ Check if user exists (in transaction)");
        // 2️⃣ Check if user exists (in transaction)
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

        console.log("3️⃣ Create new user");
        // 3️⃣ Create new user
        const newUser = new this.UserModel({
          fullName,
          userName: userName,
          email: email.toLowerCase(),
          password,
        });

        console.log("4️⃣ Save user first to get _id");
        // 4️⃣ Save user first to get _id
        await newUser.save({ session });

        let referralBonus = 0;
        let referrerUser = null;

        console.log("5️⃣ Handle referral if valid code");
        // 5️⃣ Handle referral if valid code
        if (referral && referral.trim() !== "") {
          const referrer = await this.UserModel.findOne({
            referralCode: referral.trim(),
          }).session(session);

          if (referrer) {
            referrerUser = referrer;

            // Update user with referrer
            newUser.referredBy = referrer._id;
            await newUser.save({ session });

            // Create referral record
            const Referrals = new this.ReferralModel({
              referrer: referrer._id,
              referredUser: newUser._id,
              referralCodeUsed: referral.trim(),
              status: "pending",
            });
            await Referrals.save({ session });

            // Update referrer (uncomment if needed)
            // referrer.referrals.push(newUser._id);
            // referrer.totalReferrals += 1;
            await referrer.save({ session });

            // Set referral bonus
            referralBonus = 1000; // 10 USD in cents/kobo

            console.log("5a️⃣ Generate transaction for referrer");
            // Generate transaction for referrer
            const transaction = new this.TransactionModel({
              userId: referrer._id,
              type: "profit",
              creditedAmount: referralBonus,
              description: `Referral amount sent`,
              status: "completed",
            });
            await transaction.save({ session }); // ⚠️ FIXED: Added session
          }
          // If invalid code, just ignore (don't throw error)
        }

        console.log("6️⃣ Create wallet (with or without bonus)");
        // 6️⃣ Create wallet (with or without bonus)
        await this.WalletModel.create(
          [
            {
              userId: newUser._id,
              balance: 0,
              currency: "USD",
            },
          ],
          { session },
        );

        // ⚠️ FIXED: Only update referrer wallet if referrer exists
        if (referrerUser) {
          await this.WalletModel.updateOne(
            { userId: referrerUser._id },
            { $inc: { balance: referralBonus } },
            { session },
          );
        }

        console.log("7️⃣ Create welcome notification");
        // 7️⃣ Create welcome notification
        const notification = new this.NotificationModel({
          user: newUser._id,
          // ⚠️ FIXED: Removed duplicate 'type' and 'category'
          type: "signup",
          title: "Welcome to Our Platform!",
          message: `Hello ${newUser.fullName}, thank you for signing up!`,
          priority: "low",
          category: "signup", // ⚠️ FIXED: Kept only one category
        });
        await notification.save({ session });

        console.log("8️⃣ Return sanitized data");
        // 8️⃣ Return sanitized data
        return {
          id: newUser._id,
          fullName: newUser.fullName,
          userName: newUser.userName, // ⚠️ FIXED: Changed from 'username' to 'userName'
          email: newUser.email,
          referralCode: newUser.referralCode,
          referredBy: newUser.referredBy,
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
