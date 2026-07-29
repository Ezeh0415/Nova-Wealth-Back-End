"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenAuth = void 0;
const GetJwtToken_1 = require("../Middleware/jwtConfig/GetJwtToken");
const UserSchema_1 = __importDefault(require("../Module/Auth/Model/UserSchema"));
class TokenAuth {
    constructor() {
        this.user = UserSchema_1.default;
        this.tokenService = GetJwtToken_1.TokenService.getInstance();
    }
    static getInstance() {
        if (!TokenAuth.instance) {
            TokenAuth.instance = new TokenAuth();
        }
        return TokenAuth.instance;
    }
    async authenticate(req, res, next) {
        const accessToken = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN
        const refreshToken = req.headers["x-refresh-token"];
        if (!accessToken || !refreshToken) {
            return res.status(401).json({
                error: "Tokens are required",
            });
        }
        // Verify tokens
        const result = await this.tokenService.verifyBothTokens(accessToken, refreshToken);
        if (!result.valid) {
            return res.status(401).json({
                error: "Invalid or expired tokens",
            });
        }
        // Attach user data to request
        req.user = result.decoded;
        next();
    }
    async FrontEndVerify(req, res) {
        const accessToken = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN
        const refreshToken = req.headers["x-refresh-token"];
        if (!accessToken || !refreshToken) {
            return res.status(401).json({
                error: "Tokens are required",
            });
        }
        // Verify tokens
        const result = await this.tokenService.verifyBothTokens(accessToken, refreshToken);
        if (!result.valid) {
            return res.status(401).json({
                error: "Invalid or expired tokens",
            });
        }
        let user = result.decoded.userId;
        console.log(user);
        const data = await this.user.findById(user);
        if (!data) {
            return res.status(401).json({
                error: "Missing user",
            });
        }
        return res.status(200).json({
            data
        });
    }
}
exports.TokenAuth = TokenAuth;
