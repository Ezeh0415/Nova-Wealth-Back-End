class AdminUserUpdateServices {
  constructor({ userModel, WalletModel }) {
    this.userModel = userModel;
    this.WalletModel = WalletModel;
  }

  async getAdminUser(userId) {
    if (!userId) {
      throw new Error("User id is required");
    }
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      const wallet = await this.WalletModel.findOne({ userId: userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      return {
        user,
        wallet,
      };
    } catch (error) {
      throw new Error("Error fetching user");
    }
  }

  async updateAdminUser(userId, updatedUser) {
    if (!userId) {
      throw new Error("User id is required");
    }
    try {
      const user = await this.WalletModel.findOneAndUpdate(
        { userId: userId },
        { $set: updatedUser },
        { new: true, runValidators: true },
      );
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      throw new Error("Error updating user service");
    }
  }
}

module.exports = AdminUserUpdateServices;
