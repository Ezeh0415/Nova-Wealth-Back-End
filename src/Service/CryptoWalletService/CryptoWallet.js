class CryptoWalletService {
  constructor(CryptoWalletSchema) {
    this.CryptoWalletSchema = CryptoWalletSchema;
  }

  async getCryptoWallet() {
    const CryptoWallet = await this.CryptoWalletSchema.find();
    return CryptoWallet;
  }

async CreateCryptoWallet(CryptoName, CryptoAddress) {
  try {
    if (!CryptoName || !CryptoAddress) {
      throw new Error("CryptoName and CryptoAddress are required");
    }

    const CryptoWallet = new this.CryptoWalletSchema({
      cryptoName: CryptoName.toUpperCase(),
      cryptoAddress: CryptoAddress,
    });

    await CryptoWallet.save();

    return CryptoWallet;
  } catch (error) {
    throw new Error("Error creating CryptoWallet: " + error.message);
  }
}

async UpdateCryptoWallet(userId, CryptoAddress) {
  try {
    if (!userId || !CryptoAddress) {
      throw new Error("Wallet ID and CryptoAddress are required");
    }

    const CryptoWallet = await this.CryptoWalletSchema.findById(userId);
    
    if (!CryptoWallet) {
      throw new Error("CryptoWallet not found");
    }

    CryptoWallet.cryptoAddress = CryptoAddress;
    CryptoWallet.updatedAt = Date.now();

    await CryptoWallet.save();

    return CryptoWallet;
  } catch (error) {
    throw new Error("Error updating CryptoWallet: " + error.message);
  }
}

async DeleteCryptoWallet(userId) {
  try {
    if (!userId) {
      throw new Error("Wallet ID is required");
    }

    const CryptoWallet = await this.CryptoWalletSchema.findByIdAndDelete(userId);
    
    if (!CryptoWallet) {
      throw new Error("CryptoWallet not found");
    }
    
    return CryptoWallet;
  } catch (error) {
    throw new Error("Error deleting CryptoWallet: " + error.message);
  }
}
}

module.exports = CryptoWalletService;
