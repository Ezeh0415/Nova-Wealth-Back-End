class AdminUserUpdateContr {
  constructor(AdminUserUpdateServices) {
    this.AdminUserUpdateServices = AdminUserUpdateServices;

    // bind the services to the controller
    this.getAdminUser = this.getAdminUser.bind(this);
    this.updateAdminUser = this.updateAdminUser.bind(this);
  }

  async getAdminUser(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "Please provide all the required fields",
        });
      }

      const user = await this.AdminUserUpdateServices.getAdminUser(userId);
      return res.status(200).json({ success: true, user });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: error.message,
      });
    }
  }

  async updateAdminUser(req, res) {
    try {

      const userId = req.body.userId;

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "Please provide all the required fields",
        });
      }

      const user = await this.AdminUserUpdateServices.updateAdminUser(
        userId,
        req.body,
      );

      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: error.message,
      });
    }
  }
}

module.exports = AdminUserUpdateContr;
