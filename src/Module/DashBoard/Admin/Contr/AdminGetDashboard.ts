import { Response } from "express";
import { AuthRequest } from "../../../../config/JWTAUth";
import { AdminGetDashBoard } from "../Service/AdminGetDashBoard";

export class AdminGetDashBoardContr {
    private static instance: AdminGetDashBoardContr;
    private AdminGetDashBoard: AdminGetDashBoard;

    private constructor() {
        this.AdminGetDashBoard = AdminGetDashBoard.getInstance();
    };

    public static getInstance(): AdminGetDashBoardContr {
        if (!AdminGetDashBoardContr.instance) {
            AdminGetDashBoardContr.instance = new AdminGetDashBoardContr();
        }

        return AdminGetDashBoardContr.instance;
    }

    public async getAdminDashBoardUsers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user.userId;

            const result = await this.AdminGetDashBoard.getAdminDashboardUsers(userId);
            res.status(200).json({ data: result })
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage)
        }
    }

    public async getAdminDashBoardWallets(req: AuthRequest, res: Response): Promise<void> {
        try {
            const result = await this.AdminGetDashBoard.getAdminDashboardWallet();
            res.status(200).json({ data: result })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json(errorMessage)
        }
    }
}