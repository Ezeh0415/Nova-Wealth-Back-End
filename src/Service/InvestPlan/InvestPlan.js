class InvestPlan {
  constructor(InvestmentPlanModel) {
    this.InvestmentPlanModel = InvestmentPlanModel;
  }

  async CreateInvestPlan(data) {
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
    } = data;

    if (
      !planId ||
      !name ||
      !minAmount ||
      !maxAmount ||
      !color ||
      !iconName ||
      !roi ||
      !duration ||
      !description
    ) {
      throw new Error("Missing required fields");
    } else {
      const newInvestmentPlan = await this.InvestmentPlanModel.create({
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
      return {
        success: true,
        message: "Investment plan created successfully",
        data: {
          investmentPlan: newInvestmentPlan,
        },
      };
    }
  }

  async UpdateInvestmentPlan(data) {
    const {
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
    } = data;
    const investmentPlan = await this.InvestmentPlanModel.findById(id);
    if (!investmentPlan) {
      throw new Error("Investment plan not found");
    } else {
      investmentPlan.planId = planId;
      investmentPlan.name = name;
      investmentPlan.minAmount = minAmount;
      investmentPlan.maxAmount = maxAmount;
      investmentPlan.color = color;
      investmentPlan.iconName = iconName;
      investmentPlan.roi = roi;
      investmentPlan.duration = duration;
      investmentPlan.description = description;
      investmentPlan.isActive = isActive;
      investmentPlan.features = features;
      await investmentPlan.save();
      return {
        success: true,
        message: "Investment plan updated successfully",
        data: {
          investmentPlan: investmentPlan,
        },
      };
    }
  }

  async DeleteInvestmentPlan(id) {
    const investmentPlan = await this.InvestmentPlanModel.findById({
      _id: id,
    });
    if (!investmentPlan) {
      throw new Error("Investment plan not found");
    } else {
      await investmentPlan.deleteOne({
        _id: id,
      });
      return {
        success: true,
        message: "Investment plan deleted successfully",
      };
    }
  }
}

module.exports = InvestPlan;
