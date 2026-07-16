"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDashboardContr = void 0;
const ClientDashBoard_1 = require("../Service/ClientDashBoard");
class GetDashboardContr {
    constructor() {
        this.serviceDashBoard = ClientDashBoard_1.ClientDashboard.getInstance();
    }
    static getInstance() {
        if (!GetDashboardContr.instance) {
            GetDashboardContr.instance = new GetDashboardContr();
        }
        return GetDashboardContr.instance;
    }
    async getDashBoard(req, res) {
        try {
            const userId = req.user.userId;
            // const userId = req.body;
            const dashboard = await this.serviceDashBoard.getDashboard(userId);
            res.status(200).json(dashboard);
            return;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage);
        }
    }
    async getInvestPlan(req, res) {
        try {
            const investPlan = await this.serviceDashBoard.getInvestPlan();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage);
        }
    }
}
exports.GetDashboardContr = GetDashboardContr;
