"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userUpdateContr = void 0;
const ZodError_1 = require("../../../Utili/ZodError/ZodError");
const userUpdateService_1 = require("../Service/userUpdateService");
class userUpdateContr {
    constructor() {
        this.userUpdateService = userUpdateService_1.userUpdateService.getInstance();
    }
    static getInstance() {
        if (!userUpdateContr.instance) {
            userUpdateContr.instance = new userUpdateContr();
        }
        return userUpdateContr.instance;
    }
    async AdminGetUser(req, res) {
        try {
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({
                    status: "error",
                    message: "Please provide all the required fields",
                });
                return;
            }
            const user = await this.userUpdateService.AdminGetUser(userId);
            res.status(200).json({ success: true, user });
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
    async AdminUpdateUser(req, res) {
        try {
            const userId = req.body.updateData.userId;
            if (!userId) {
                res.status(400).json({
                    status: "error",
                    message: "Please provide all the required fields",
                });
                return;
            }
            const user = await this.userUpdateService.AdminUpdateUser(userId, req.body.updateData);
            res.status(200).json({ success: true, user });
            return;
        }
        catch (error) {
            if (ZodError_1.ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            });
            return;
        }
    }
}
exports.userUpdateContr = userUpdateContr;
