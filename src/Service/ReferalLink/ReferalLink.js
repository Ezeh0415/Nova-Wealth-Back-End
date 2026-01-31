const { nanoid } = require("nanoid");
class ReferralService {
  constructor({ userModel, referralModel, NotificationModel }) {
    // Initialization database  here

    this.userModel = userModel;
    this.referralModel = referralModel;
    this.NotificationModel = NotificationModel;
  }

  async createReferralLink(userId) {
    if (!userId) {
      throw new Error("User ID is required to create a referral link.");
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const uniqueCode = nanoid(10); // Generate a unique referral code
    const referralCode = `${user.userName}-${uniqueCode}`;

    const referralLink = `${process.env.FRONTEND_URL}/signup?ref=${referralCode}`;

    const referralPage = `${process.env.FRONTEND_URL}/referrals`;

    user.referralCode = referralCode;
    user.referralLink = referralLink;
    await user.save();

    // Optionally, create a notification for the user about their new referral link
    const notification = new this.NotificationModel({
      user: user._id,
      type: "referral",
      title: "Your Referral Link is Created!",
      message: `Hello ${user.fullName}, your referral link has been created successfully. Share it with your friends to earn rewards!`,
      data: { referralLink },
      priority: "low",
      category: "referral",
      actionUrl: referralPage,
      icon: "referral",
    });

    await notification.save();

    return {
      referralLink,
    };
  }
}

module.exports = ReferralService;
