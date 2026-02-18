class KeyController {
  constructor(KeyService) {
    this.KeyService = KeyService;

    // bind to service
    this.verifyKyc = this.verifyKyc.bind(this);
    this.ConfirmKyc = this.ConfirmKyc.bind(this);
    this.CancleKyc = this.CancleKyc.bind(this);
  }

  async verifyKyc(req, res) {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: "user id needed" });
    }

    try {
      const result = await this.KeyService.verifyKyc(userId, req.body);
      res.status(200).json({
        success: true,
        result,
      });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ message: error.message });
    }
  }

  async ConfirmKyc(req, res) {
    try {
      const result = await this.KeyService.ConfirmKyc(
        req.body.userId,
        req.body.KycId,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(`failed on  kyc confirmation try again  ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async CancleKyc(req, res) {
    try {
      const result = await this.KeyService.CancleKyc(
        req.body.userId,
        req.body.KycId,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(`failed on kyc cancle try again  ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = KeyController;
