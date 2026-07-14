"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotificationContr = void 0;
const UpdateNotification_1 = require("../Service/UpdateNotification");
class UpdateNotificationContr {
    constructor() {
        this.UpdateNotification = UpdateNotification_1.UpdateNotification.getInstance();
    }
    static getInstance() {
        if (!UpdateNotificationContr.instance) {
            UpdateNotificationContr.instance = new UpdateNotificationContr();
        }
        return UpdateNotificationContr.instance;
    }
    async UpdateSingleNotif(req, res) {
        try {
            const { notificationId } = req.body;
            const data = await this.UpdateNotification.updateSingleNotif(notificationId);
            res.status(200).json(data);
            return;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage);
        }
    }
    async updateUserAllNotif(req, res) {
        try {
            const userId = req.user.userId;
            const data = await this.UpdateNotification.updateAllNotif(userId);
            res.status(200).json(data);
            return;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage);
        }
    }
}
exports.UpdateNotificationContr = UpdateNotificationContr;
