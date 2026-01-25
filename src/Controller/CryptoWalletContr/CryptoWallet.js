class CryptoWalletContr {
  constructor(CryptoWalletService) {
    this.CryptoWalletService = CryptoWalletService;

    // bind this to the class

    this.getCryptoWallet = this.getCryptoWallet.bind(this);
    this.CreateCryptoWallet = this.CreateCryptoWallet.bind(this);
    this.UpdateCryptoWallet = this.UpdateCryptoWallet.bind(this);
    this.DeleteCryptoWallet = this.DeleteCryptoWallet.bind(this);
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

  async CreateCryptoWallet(req, res) {
    try {
      const { CryptoName, CryptoAddress } = req.body;
      if (!CryptoName || !CryptoAddress) {
        return res.status(400).json({
          status: "error",
          message: "Please provide all the required fields",
        });
      }

      await this.CryptoWalletService.CreateCryptoWallet(
        CryptoName,
        CryptoAddress,
      );
      return res.status(200).json({
        success: true,
        message: "Wallet created successfully",
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
      const { userId, CryptoAddress } = req.body;
      if (!userId || !CryptoAddress) {
        return res.status(400).json({
          status: "error",
          message: "Please provide all the required fields",
        });
      }

      await this.CryptoWalletService.UpdateCryptoWallet(userId, CryptoAddress);
      return res.status(200).json({
        success: true,
        message: "Wallet updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async DeleteCryptoWallet(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "Please provide all the required fields",
        });
      }

      await this.CryptoWalletService.DeleteCryptoWallet(userId);
      return res.status(200).json({
        success: true,
        message: "Wallet deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
}

module.exports = CryptoWalletContr;
