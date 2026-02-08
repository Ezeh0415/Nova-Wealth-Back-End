class InvestPlanContr {
  constructor(InvestPlan) {
    this.InvestPlan = InvestPlan;

    // bind the methods to the class

    this.CreateInvestPlan = this.CreateInvestPlan.bind(this);
    this.UpdateInvestmentPlan = this.UpdateInvestmentPlan.bind(this);
    this.DeleteInvestmentPlan = this.DeleteInvestmentPlan.bind(this);
  }

  async CreateInvestPlan(req, res) {
    try {
      const {
        planId,
        name,
        minAmount,
        maxAmount,
        color,
        iconName,
        roi,
        duration,
        description,
        isActive,
        features,
      } = req.body;
      const newInvestmentPlan = await this.InvestPlan.CreateInvestPlan({
        planId,
        name,
        minAmount,
        maxAmount,
        color,
        iconName,
        roi,
        duration,
        description,
        isActive,
        features,
      });
      res.status(201).json(newInvestmentPlan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async UpdateInvestmentPlan(req, res) {
    try {
      const { id } = req.params;
      const {
        planId,
        name,
        minAmount,
        maxAmount,
        color,
        iconName,
        roi,
        duration,
        description,
        isActive,
        features,
      } = req.body;
      const updatedInvestmentPlan = await this.InvestPlan.UpdateInvestmentPlan({
        id,
        planId,
        name,
        minAmount,
        maxAmount,
        color,
        iconName,
        roi,
        duration,
        description,
        isActive,
        features,
      });
      res.status(200).json(updatedInvestmentPlan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async DeleteInvestmentPlan(req, res) {
    try {
      const { id } = req.params;
      const deletedInvestmentPlan =
        await this.InvestPlan.DeleteInvestmentPlan(id);
      res.status(200).json(deletedInvestmentPlan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = InvestPlanContr;
