class CryptoWalletContr {
  constructor(CryptoWalletService) {
    this.CryptoWalletService = CryptoWalletService;

    // bind this to the class

    this.getCryptoWallet = this.getCryptoWallet.bind(this);
    this.UpdateCryptoWallet = this.UpdateCryptoWallet.bind(this);
  }

  async getCryptoWallet(req, res) {
    try {
      const cryptoWallet = await this.CryptoWalletService.getCryptoWallet();
      res.status(200).json({
        status: "success",
        data: cryptoWallet,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async UpdateCryptoWallet(req, res) {
    try {
        const {cryptoName, cryptoAddress} = req.body;
    }
  }
}
module.exports = CryptoWalletContr;
