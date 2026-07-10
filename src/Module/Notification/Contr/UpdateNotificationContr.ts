import { Response } from "express";
import { AuthRequest } from "../../../config/JWTAUth";
import { UpdateNotification } from "../Service/UpdateNotification";

export class UpdateNotificationContr {
    private static instance: UpdateNotificationContr;
    private UpdateNotification: UpdateNotification;

    private constructor() {
        this.UpdateNotification = UpdateNotification.getInstance();
    }

    public static getInstance(): UpdateNotificationContr {
        if (!UpdateNotificationContr.instance) {
            UpdateNotificationContr.instance = new UpdateNotificationContr();
        }

        return UpdateNotificationContr.instance;
    }

    public async UpdateSingleNotif(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { notificationId } = req.body;
            const data = await this.UpdateNotification.updateSingleNotif(notificationId as string);
            res.status(200).json(data);
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage)
        }
    }

    public async updateUserAllNotif(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user.userId;
            const data = await this.UpdateNotification.updateAllNotif(userId);
            res.status(200).json(data);
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage)
        }
    }
}