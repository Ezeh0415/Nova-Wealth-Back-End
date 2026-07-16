"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = void 0;
const Config_1 = require("../../config/Config");
class ApiKey {
    constructor() {
        this.config = Config_1.AppConfig.getInstance();
    }
    static getInstance() {
        if (!ApiKey.instance) {
            ApiKey.instance = new ApiKey();
        }
        return ApiKey.instance;
    }
    async RequireApiKey(req, res, next) {
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
exports.ApiKey = ApiKey;
