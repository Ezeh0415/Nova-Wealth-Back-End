class DashboardContr {
  constructor(dashboardService) {
    this.dashboardService = dashboardService;

    // bind the dashboardService to the DashboardContr

    this.getDashboard = this.getDashboard.bind(this);
    this.getInvestPlan = this.getInvestPlan.bind(this);
  }

  async getDashboard(req, res) {
    const id = req.user.id;
    try {
      const dashboard = await this.dashboardService.getDashboard(id);
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInvestPlan(req, res) {
    try {
      const investPlan = await this.dashboardService.getInvestPlan();
      res.json(investPlan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DashboardContr;
