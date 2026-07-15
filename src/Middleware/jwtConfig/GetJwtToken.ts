
import jwt from "jsonwebtoken";
import { AppConfig } from "../../config/Config";

export class TokenService {
    private static instance: TokenService;
    private config: AppConfig;

    private constructor() {
        this.config = AppConfig.getInstance(); // Get instance, not the class
    }

    public static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    public async getJwtToken(userId: object, email: string): Promise<string> {
        const jwtKey = this.config.JWT_SECRET_KEY; // Use instance property
        if (!jwtKey) {
            throw new Error("JWT_TOKEN_KEY is not defined");
        }
        const expiresIn = this.config.JWT_ACCESS_EXPIRES_IN ?? "5m";
        const token = jwt.sign(
            { userId, email },
            jwtKey as jwt.Secret,
            { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] }
        );

        return token;
    }

    public async getRefreshJwtToken(userId: object, email: string): Promise<string> {
        const jwtKey = this.config.JWT_REFRESH_SECRET;
        if (!jwtKey) {
            throw new Error("JWT_REFRESH_TOKEN_KEY is not defined");
        }

        const expiresIn = this.config.JWT_REFRESH_EXPIRES_IN ?? "7d";
        const token = jwt.sign(
            { userId, email },
            jwtKey as jwt.Secret,
            { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] }
        );

        return token;
    }

    public async verifyAccessToken(token: string): Promise<{ valid: boolean; decoded?: any }> {
        try {
            const decoded = jwt.verify(token, this.config.JWT_SECRET_KEY);
            return { valid: true, decoded };
        } catch (error) {
            return { valid: false };
        }
    }

    public async verifyRefreshToken(token: string): Promise<{ valid: boolean; decoded?: any }> {
        try {
            const decoded = jwt.verify(token, this.config.JWT_REFRESH_SECRET);
            return { valid: true, decoded };
        } catch (error) {
            return { valid: false };
        }
    }


    public async verifyBothTokens(accessToken: string, refreshToken: string): Promise<{
        valid: boolean;
        decoded?: any;
        needsNewAccessToken?: boolean;
    }> {
        // Try access token first
        try {
            const decoded = jwt.verify(accessToken, this.config.JWT_SECRET_KEY);
            return { valid: true, decoded };
        } catch (accessError) {
            // Access token failed, try refresh token
            try {
                const decoded = jwt.verify(refreshToken, this.config.JWT_REFRESH_SECRET);
                // Refresh token is valid, but access token expired
                return {
                    valid: true,
                    decoded,
                    needsNewAccessToken: true
                };
            } catch (refreshError) {
                // Both tokens are invalid
                return { valid: false };
            }
        }
    }
}

export default TokenService.getInstance();