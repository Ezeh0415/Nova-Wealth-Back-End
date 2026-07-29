import { Response } from "express";
import { AuthRequest } from "../../../config/JWTAUth";
import { ErrorHandler } from "../../../Utili/ZodError/ZodError";
import { userUpdateService } from "../Service/userUpdateService";
import { success } from "zod";

export class userUpdateContr {
    private static instance: userUpdateContr;
    private userUpdateService: userUpdateService;

    private constructor() {
        this.userUpdateService = userUpdateService.getInstance();
    }

    public static getInstance(): userUpdateContr {
        if (!userUpdateContr.instance) {
            userUpdateContr.instance = new userUpdateContr();
        }

        return userUpdateContr.instance;
    }

    public async AdminGetUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({
                    status: "error",
                    message: "Please provide all the required fields",
                });

                return;
            }

            const user = await this.userUpdateService.AdminGetUser(userId as string);

            res.status(200).json({ success: true, user });
            return;
        } catch (error) {
            if (ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);

            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            })

            return;
        }
    }

    public async AdminUpdateUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.body.updateData.userId;

            if (!userId) {
                res.status(400).json({
                    status: "error",
                    message: "Please provide all the required fields",
                });

                return;
            }

            const user = await this.userUpdateService.AdminUpdateUser(
                userId,
                req.body.updateData,
            )

            res.status(200).json({ success: true, user });
            return;
        } catch (error) {
            if (ErrorHandler.handleZodError(res, error)) {
                return;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);

            res.status(500).json({
                success: false,
                message: 'internal server error',
                error: errorMessage,
            })

            return;
        }
    }
}