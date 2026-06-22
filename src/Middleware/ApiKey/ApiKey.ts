import { NextFunction, Request, Response } from "express";
import { AppConfig } from "../../config/Config";

export class ApiKey {
    private static instance: ApiKey;
    private config: AppConfig;

    public constructor() {
        this.config = AppConfig.getInstance();
    }

    public static getInstance(): ApiKey {
        if (!ApiKey.instance) {
            ApiKey.instance = new ApiKey();
        }
        return ApiKey.instance;
    }

    public async RequireApiKey(req: Request, res: Response, next: NextFunction) {
        // Allow API key from query, headers, or body
        const apiKey = req.query.key || req.header("x-api-key") || req.body?.key;

        if (!apiKey) {
            return res.status(401).json({
                error: "API key is required",
                message: "Provide API key in query (?key=), body, or header (x-api-key)",
            });
        }

        if (apiKey !== this.config.API_KEY) {
            return res.status(403).json({
                error: "Invalid API key",
                message: "The provided API key is incorrect",
            });
        }

        // Key is valid → continue
        next();
    }
}