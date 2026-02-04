class MarkNotificationUpdate {
  constructor(ReadNotification) {
    // Initialization code if needed
    this.ReadNotification = ReadNotification;

    // Bind methods
    this.UpdateSingleNotification = this.UpdateSingleNotification.bind(this);
    this.UpdateAllNotifications = this.UpdateAllNotifications.bind(this);
  }

  async UpdateSingleNotification(req, res) {
    const { notificationId } = req.body;
    try {
      const data =
        await this.ReadNotification.UpdateSingleNotification(notificationId);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async UpdateAllNotifications(req, res) {
    try {
      const data = await this.ReadNotification.UpdateAllNotifications();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = MarkNotificationUpdate;
