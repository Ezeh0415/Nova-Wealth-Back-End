class Investment {
  constructor(InvestmentService) {
    this.InvestmentService = InvestmentService;

    // bind the methods to the class

    this.invest = this.invest.bind(this);
    this.processDailyROI = this.processDailyROI.bind(this);
  }

  async invest(req, res) {
    const {
      amount,
      roi,
      investmentType,
      investmentStartDate,
      investmentEndDate,
    } = req.body;

    try {
      if (
        !amount ||
        !roi ||
        !investmentType ||
        !investmentStartDate ||
        !investmentEndDate
      ) {
        return res
          .status(400)
          .json({ message: "Please provide all required fields" });
      }

      const investment = await this.InvestmentService.invest(
        req.user.id,
        amount,
        roi,
        investmentType,
        investmentStartDate,
        investmentEndDate
      );

      return res.status(200).json(investment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async processDailyROI(req, res) {
    await this.InvestmentService.processDailyROI();
  }
}

module.exports = Investment;
