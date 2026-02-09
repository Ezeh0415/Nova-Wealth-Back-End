class Investment {
  constructor(InvestmentService) {
    this.InvestmentService = InvestmentService;

    // bind the methods to the class

    this.invest = this.invest.bind(this);
    this.confirmInvestment = this.confirmInvestment.bind(this);
    this.processDailyROI = this.processDailyROI.bind(this);
  }

  async invest(req, res) {
    const { amount, investmentType } = req.body;

    const userId = req.user.id;

    try {
      if (!userId || !amount || !investmentType) {
        return res
          .status(400)
          .json({ message: "Please provide all required fields" });
      }

      const investment = await this.InvestmentService.invest(
        userId,
        amount,
        investmentType,
      );

      return res.status(200).json(investment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async confirmInvestment(req, res) {
    try {
      const { investmentId } = req.body;
      const investConfirm =
        await this.InvestmentService.confirmInvestment(investmentId);

      return res.status(200).json(investConfirm);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async processDailyROI(req, res) {
    await this.InvestmentService.processDailyROI();
  }
}

module.exports = Investment;
