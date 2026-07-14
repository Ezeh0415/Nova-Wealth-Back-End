"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGetDashBoardContr = void 0;
const AdminGetDashBoard_1 = require("../Service/AdminGetDashBoard");
class AdminGetDashBoardContr {
    constructor() {
        this.AdminGetDashBoard = AdminGetDashBoard_1.AdminGetDashBoard.getInstance();
    }
    ;
    static getInstance() {
        if (!AdminGetDashBoardContr.instance) {
            AdminGetDashBoardContr.instance = new AdminGetDashBoardContr();
        }
        return AdminGetDashBoardContr.instance;
    }
    async getAdminDashBoardUsers(req, res) {
        try {
            const userId = req.user.userId;
            const result = await this.AdminGetDashBoard.getAdminDashboardUsers(userId);
            res.status(200).json({ data: result });
            return;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage);
        }
    }
    async getAdminDashBoardWallets(req, res) {
        try {
            const result = await this.AdminGetDashBoard.getAdminDashboardWallet();
            res.status(200).json({ data: result });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage);
        }
    }
}
exports.AdminGetDashBoardContr = AdminGetDashBoardContr;
