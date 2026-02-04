class ReadNotification {
  constructor(Notification) {
    this.Notification = Notification;
  }

  async UpdateSingleNotification(notificationId) {
    try {
      if (!notificationId) {
        throw new Error("Notification ID is required");
      }
      await this.Notification.findOneAndUpdate(
        { _id: notificationId },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true },
      );

      return {
        success: true,
        message: "Notification updated successfully",
      };
    } catch (error) {
      console.error("Error in ReadNotification service:", error);
      throw error; // Rethrow the error to be handled by the controller
    }
  }

  async UpdateAllNotifications() {
    try {
      await this.Notification.updateMany(
        {}, // Empty filter means ALL documents
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      );

      return {
        success: true,
        message: "All notifications updated successfully",
      };
    } catch (error) {
      console.error("Error in ReadNotification service:", error);
      throw error; // Rethrow the error to be handled by the controller
    }
  }
}

module.exports = ReadNotification;
