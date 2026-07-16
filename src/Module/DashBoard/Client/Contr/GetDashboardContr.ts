import { Request, Response } from "express";
import { AuthRequest } from "../../../../config/JWTAUth";
import { ClientDashboard } from "../Service/ClientDashBoard";

export class GetDashboardContr {
    private static instance: GetDashboardContr
    private serviceDashBoard: ClientDashboard;

    private constructor() {
        this.serviceDashBoard = ClientDashboard.getInstance();
    }

    public static getInstance(): GetDashboardContr {
        if (!GetDashboardContr.instance) {
            GetDashboardContr.instance = new GetDashboardContr()
        }

        return GetDashboardContr.instance;
    }

    public async getDashBoard(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user.userId;
            // const userId = req.body;
            const dashboard = await this.serviceDashBoard.getDashboard(userId);
            res.status(200).json(dashboard)
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage)
        }
    }

    public async getInvestPlan(req: Request, res: Response): Promise<void> {
        try {
            const investPlan = await this.serviceDashBoard.getInvestPlan();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage);
        }
    }
}