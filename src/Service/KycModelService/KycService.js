const kycLink = `${process.env.FRONTEND_URL}/Kyc`;
class KeyService {
  constructor({
    userModel,
    kycModel,
    AdminTransactionModel,
    NotificationModel,
  }) {
    this.userModel = userModel;
    this.kycModel = kycModel;
    this.AdminTransactionModel = AdminTransactionModel;
    this.NotificationModel = NotificationModel;
  }

  async verifyKyc(userId, kycData) {
    try {
      if (!userId) {
        throw new Error("User id is required");
      }
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const kyc = await this.kycModel.findOneAndUpdate(
        { userId: userId },
        { $set: kycData },
        {
          new: true, // Return the updated/created document
          upsert: true, // CREATE if not found
          runValidators: true, // Validate the data
        },
      );

      if (!kyc) {
        throw new Error("kyc update failed");
      }

      await this.AdminTransactionModel.create({
        userId: userId,
        transactionId: kyc._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        type: "kyc",
        isConfirmed: "pending",
      });

      await this.NotificationModel.create({
        user: userId,
        transactionId: kyc._id,
        title: "kyc submitted and pending ",
        type: "kyc",
        message: "kyc is pending",
        priority: "high",
        type: "kyc",
        path: kycLink,
        category: "kyc",
      });

      return {
        kyc,
      };
    } catch (error) {
      throw new Error(`Error updating user service ${error.message}`);
    }
  }

  async ConfirmKyc(userId, KycId) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      const kyc = await this.kycModel.findOne({ userId: userId, _id: KycId });
      if (!kyc) {
        throw new Error("kyc not found");
      }
      kyc.KycStatus = "verified";
      await kyc.save();
      user.KycStatus = "verified";
      user.isActive = true;
      await user.save();

      const adminTransaction = await this.AdminTransactionModel.findOne({
        userId: userId,
        transactionId: KycId,
      });

      adminTransaction.isConfirmed = "true";
      await adminTransaction.save();

      await this.NotificationModel.create({
        user: userId,
        transactionId: kyc._id,
        title: "kyc confirmed and verified ",
        type: "kyc",
        message: "kyc verified",
        priority: "low",
        type: "kyc",
        path: kycLink,
        category: "kyc",
      });
      return kyc;
    } catch (error) {
      throw new Error(`Error updating user service ${error.message}`);
    }
  }

  async CancleKyc(userId, KycId) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      const kyc = await this.kycModel.findOne({ userId: userId, _id: KycId });
      if (!kyc) {
        throw new Error("kyc not found");
      }
      kyc.KycStatus = "failed";
      kyc.Comments =
        "kyc failed might be too much trafic try again in a little while";
      await kyc.save();
      user.KycStatus = "failed";
      await user.save();

      const adminTransaction = await this.AdminTransactionModel.findOne({
        userId: userId,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        transactionId: KycId,
      });

      adminTransaction.isConfirmed = "failed";
      await adminTransaction.save();

      await this.NotificationModel.create({
        user: userId,
        transactionId: kyc._id,
        title: "kyc invalid and unverified ",
        type: "kyc",
        message: "kyc failed",
        priority: "urgent",
        type: "kyc",
        path: kycLink,
        category: "kyc",
      });
      return kyc;
    } catch (error) {
      throw new Error(`Error updating user service ${error.message}`);
    }
  }
}

module.exports = KeyService;
