class AdminDashboard {
  constructor(AdminDashboard) {
    this.AdminDashboard = AdminDashboard;

    // bind methods
    this.getAdminDashboardUsers = this.getAdminDashboardUsers.bind(this);
    this.getAdminDashBoardWallets = this.getAdminDashBoardWallets.bind(this);
  }

  async getAdminDashboardUsers(req, res) {
    try {
      const userId = req.user.id; // assuming userId is set in req by authentication middleware

      const result = await this.AdminDashboard.getAdminDashboardUsers(userId);
      return res.status(200).json({ data: result });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAdminDashBoardWallets(req, res) {
    try {
      const { userId } = req.body;
      const result = await this.AdminDashboard.getAdminDashBoardWallets(userId);
      return res.status(200).json({ data: result });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = AdminDashboard;
