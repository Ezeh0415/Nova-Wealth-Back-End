class CryptoWalletService {
  constructor(CryptoWallet) {
    this.CryptoWallet = CryptoWallet;
  }

  async getCryptoWallet() {
    const CryptoWallet = await this.CryptoWallet.find();
    return CryptoWallet;
  }

  async UpdateCryptoWallet(CryptoName, CryptoAddress) {
    if (!CryptoName || !CryptoAddress) {
      throw new Error("CryptoName or CryptoAddress is required");
    }

    const CryptoWallet = await this.CryptoWallet.findOneAndUpdate(
      { CryptoName: CryptoName },
      { CryptoAddress: CryptoAddress }
    );

    if (!CryptoWallet) {
      throw new Error("CryptoWallet not found");
    }

    return CryptoWallet;
  }
}

module.exports = CryptoWalletService;
