class markNotificationAsReadContr {
  constructor({ markNotificationAsReadService }) {
    this.markNotificationAsReadService = markNotificationAsReadService;
    this.execute = this.execute.bind(this);
  }

  async execute(req, res) {
    try {
      const { notificationId } = req.body;
      await this.markNotificationAsReadService.execute({ notificationId });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = markNotificationAsReadContr;
