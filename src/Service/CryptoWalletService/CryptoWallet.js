class CryptoWalletService {
  constructor(CryptoWalletSchema) {
    this.CryptoWalletSchema = CryptoWalletSchema;
  }

  async getCryptoWallet() {
    const CryptoWallet = await this.CryptoWalletSchema.find();
    return CryptoWallet;
  }

  async UpdateCryptoWallet(CryptoName, CryptoAddress) {
    if (!CryptoName || !CryptoAddress) {
      throw new Error("CryptoName or CryptoAddress is required");
    }

    const CryptoWallet = new this.CryptoWalletSchema({
      cryptoName: CryptoName,
      cryptoAddress: CryptoAddress,
    });

    await CryptoWallet.save();

    return CryptoWallet;
  }

  async DeleteCryptoWallet(userId) {
    const CryptoWallet = await this.CryptoWalletSchema.findOneAndDelete({
      _id: userId,
    });
    if (!CryptoWallet) {
      throw new Error("CryptoWallet not found");
    }
    return CryptoWallet;
  }
}

module.exports = CryptoWalletService;
