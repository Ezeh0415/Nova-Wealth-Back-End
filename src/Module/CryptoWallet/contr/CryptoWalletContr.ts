import { Response } from "express";
import { AuthRequest } from "../../../config/JWTAUth";
import { ErrorHandler } from "../../../Utili/ZodError/ZodError";
import { CryptoWalletService } from "../Service/CryptoWallet";
import { createCryptoWallet, deleteCryptoWallet, updateCryptoWallet } from "../ZodValidation/CreateCryptoWallet";

export class CryptoWalletContr {
    private static instance: CryptoWalletContr;
    private CryptoWalletService: CryptoWalletService;

    private constructor() {
        this.CryptoWalletService = CryptoWalletService.getInstance()
    }

    public static getInstance(): CryptoWalletContr {
        if (!CryptoWalletContr.instance) {
            CryptoWalletContr.instance = new CryptoWalletContr();
        }

        return CryptoWalletContr.instance
    }

    public async getCryptoWallet(req: AuthRequest, res: Response): Promise<void> {
        try {
            const result = await this.CryptoWalletService.getCryptoWallets();
            res.status(200).json({
                status: "success",
                data: result,
            });
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

    public async createCryptoWallet(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userData = await createCryptoWallet.parse(req.body);

            await this.CryptoWalletService.createCryptoWallet(userData);

            res.status(200).json({
                success: true,
                message: "Wallet created successfully",
            })

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

    public async updateCryptoWallet(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userData = await updateCryptoWallet.parse(req.body);

            await this.CryptoWalletService.updateCryptoWallet(userData);

            res.status(200).json({
                success: true,
                message: "Wallet updated successfully",
            })

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

    public async deleteCryptoWallet(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userData = await deleteCryptoWallet.parse(req.body);
            await this.CryptoWalletService.DeleteCryptoWallet(userData);
            res.status(200).json({
                success: true,
                message: "Wallet deleted successfully",
            })

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