class markNotificationAsRead {
    constructor( Notification ) {
        this.Notification = Notification;
    }

    async execute( notificationId ) {
        const notification = await this.Notification.findById( notificationId );
        notification.isRead = true;
        await notification.save();
    }

}

module.exports = markNotificationAsRead;