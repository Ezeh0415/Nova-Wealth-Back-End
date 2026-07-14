"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Config_1 = require("../../config/Config");
class TokenService {
    constructor() {
        this.config = Config_1.AppConfig.getInstance(); // Get instance, not the class
    }
    static getInstance() {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }
    async getJwtToken(userId, email) {
        const jwtKey = this.config.JWT_SECRET_KEY; // Use instance property
        if (!jwtKey) {
            throw new Error("JWT_TOKEN_KEY is not defined");
        }
        const expiresIn = this.config.JWT_ACCESS_EXPIRES_IN ?? "7d";
        const token = jsonwebtoken_1.default.sign({ userId, email }, jwtKey, { expiresIn: expiresIn });
        return token;
    }
    async getRefreshJwtToken(userId, email) {
        const jwtKey = this.config.JWT_REFRESH_SECRET;
        if (!jwtKey) {
            throw new Error("JWT_REFRESH_TOKEN_KEY is not defined");
        }
        const expiresIn = this.config.JWT_REFRESH_EXPIRES_IN ?? "7d";
        const token = jsonwebtoken_1.default.sign({ userId, email }, jwtKey, { expiresIn: expiresIn });
        return token;
    }
    async verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.JWT_SECRET_KEY);
            return { valid: true, decoded };
        }
        catch (error) {
            return { valid: false };
        }
    }
    async verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.JWT_REFRESH_SECRET);
            return { valid: true, decoded };
        }
        catch (error) {
            return { valid: false };
        }
    }
    async verifyBothTokens(accessToken, refreshToken) {
        // Try access token first
        try {
            const decoded = jsonwebtoken_1.default.verify(accessToken, this.config.JWT_SECRET_KEY);
            return { valid: true, decoded };
        }
        catch (accessError) {
            // Access token failed, try refresh token
            try {
                const decoded = jsonwebtoken_1.default.verify(refreshToken, this.config.JWT_REFRESH_SECRET);
                // Refresh token is valid, but access token expired
                return {
                    valid: true,
                    decoded,
                    needsNewAccessToken: true
                };
            }
            catch (refreshError) {
                // Both tokens are invalid
                return { valid: false };
            }
        }
    }
}
exports.TokenService = TokenService;
exports.default = TokenService.getInstance();
