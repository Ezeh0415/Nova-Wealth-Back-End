"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotification = void 0;
const NotificationSchema_1 = require("../Model/NotificationSchema");
class UpdateNotification {
    constructor() {
        this.Notification = NotificationSchema_1.NotificationModel;
    }
    ;
    static getInstance() {
        if (!UpdateNotification.instance) {
            UpdateNotification.instance = new UpdateNotification();
        }
        return UpdateNotification.instance;
    }
    async updateSingleNotif(notifId) {
        try {
            await this.Notification.findOneAndUpdate({ _id: notifId }, { $set: { isRead: true, readAt: new Date() } }, { new: true });
            return {
                success: true,
                message: "Notification updated successfully",
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update notification: ${error.message}`);
            }
            throw new Error('Failed to update notification : Unknown error');
        }
    }
    async updateAllNotif(userId) {
        try {
            await this.Notification.updateMany({ userId }, // filter means ALL documents with this user id
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
            return {
                success: true,
                message: "All notifications updated successfully",
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update notification: ${error.message}`);
            }
            throw new Error('Failed to update notification: Unknown error');
        }
    }
}
exports.UpdateNotification = UpdateNotification;
