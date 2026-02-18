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

  async updateAdminUser(userId, updateData) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const results = {};

      // 1. Update User Model - ONLY KycStatus and softDelete
      const userUpdate = {};
      if (updateData.KycStatus !== undefined)
        userUpdate.KycStatus = updateData.KycStatus;
      if (updateData.softDelete !== undefined)
        userUpdate.softDelete = updateData.softDelete;

      // Only update user model if there are user fields to update
      if (Object.keys(userUpdate).length > 0) {
        const updatedUser = await this.userModel.findByIdAndUpdate(
          userId,
          { $set: userUpdate },
          { new: true, runValidators: true },
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }

        results.user = updatedUser;
        console.log("User updated:", userUpdate);
      }

      // 2. Update Wallet Model - ALL other fields (wallet info)
      // These are the fields that should be updated on wallet:
      // balance, pendingInvestment, invBalance, pendingWithdraw,
      // totalDeposits, totalReturn, pending, refBonus
      const walletUpdate = {};

      // Map of wallet fields that can be updated
      const walletFields = [
        "balance",
        "pendingInvestment",
        "invBalance",
        "pendingWithdraw",
        "totalDeposits",
        "totalReturn",
        "pending",
        "refBonus",
      ];

      // Only include fields that are present in updateData
      walletFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          walletUpdate[field] = updateData[field];
        }
      });

      // Update wallet if there are wallet fields to update
      if (Object.keys(walletUpdate).length > 0) {
        const updatedWallet = await this.WalletModel.findOneAndUpdate(
          { userId: userId },
          { $set: walletUpdate },
          {
            new: true,
            runValidators: true,
            upsert: true, // Create wallet if it doesn't exist
          },
        );

        results.wallet = updatedWallet;
        console.log("Wallet updated:", walletUpdate);
      }

      return {
         results,
      };
    } catch (error) {
      console.error("Error in updateAdminUser:", error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}

module.exports = AdminUserUpdateServices;
