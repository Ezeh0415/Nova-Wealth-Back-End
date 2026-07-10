import { NotificationModel } from "../Model/NotificationSchema";

export class UpdateNotification {
    private static instance: UpdateNotification;
    private Notification = NotificationModel;

    private constructor() { };

    public static getInstance(): UpdateNotification {
        if (!UpdateNotification.instance) {
            UpdateNotification.instance = new UpdateNotification();
        }

        return UpdateNotification.instance
    }

    public async updateSingleNotif(notifId: string) {
        try {
            await this.Notification.findOneAndUpdate(
                { _id: notifId },
                { $set: { isRead: true, readAt: new Date() } },
                { new: true },
            );
            return {
                success: true,
                message: "Notification updated successfully",
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }

    public async updateAllNotif(userId: string) {
        try {
            await this.Notification.updateMany(
                { userId }, // filter means ALL documents with this user id
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
            if (error instanceof Error) {
                throw new Error(`Failed to delete investment plan: ${error.message}`);
            }
            throw new Error('Failed to delete investment plan: Unknown error');
        }
    }
}