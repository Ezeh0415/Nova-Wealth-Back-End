"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuth = void 0;
const Config_1 = require("../../../../config/Config");
const GetJwtToken_1 = require("../../../../Middleware/jwtConfig/GetJwtToken");
const UserSchema_1 = __importDefault(require("../../Model/UserSchema"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class AdminAuth {
    constructor() {
        this.user = UserSchema_1.default;
        this.SALT_ROUNDS = 10;
        this.config = Config_1.AppConfig.getInstance();
        this.TokenService = GetJwtToken_1.TokenService.getInstance();
    }
    static getInstance() {
        if (!AdminAuth.instance) {
            AdminAuth.instance = new AdminAuth();
        }
        return AdminAuth.instance;
    }
    async adminSignup(userData) {
        try {
            const isExist = await this.user.findOne({ email: userData.email });
            if (isExist) {
                throw new Error("credentials Already in use");
            }
            const hashedPassword = await bcrypt_1.default.hash(userData.password, this.SALT_ROUNDS);
            const newUser = new this.user({
                fullName: userData.fullName,
                userName: userData.userName,
                email: userData.email,
                password: hashedPassword,
                role: "admin",
                KycStatus: "verified",
                referralCode: userData.email,
                referralLink: userData.email,
                ipAddress: userData.ipAddress,
                userAgent: userData.userAgent,
            });
            await newUser.save();
            const token = await this.TokenService.getJwtToken(newUser._id, newUser.email);
            const refreshToken = await this.TokenService.getRefreshJwtToken(newUser._id, newUser.email);
            await this.user.findByIdAndUpdate(newUser._id, { $set: { refreshToken: refreshToken } }, { new: true });
            const { password: _, ...safeUser } = newUser.toObject();
            return {
                safeUser,
                token,
                refreshToken
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        }
    }
    async adminLogin(userData) {
        try {
            const isExist = await this.user.findOne({ email: userData.email }).select('+password');
            if (!isExist) {
                throw new Error("invalid user cridentials");
            }
            const isPasswordCorrect = await bcrypt_1.default.compare(userData.password, isExist?.password);
            if (!isPasswordCorrect) {
                throw new Error("password dosen`t match");
            }
            const accessToken = await this.TokenService.getJwtToken(isExist?._id, isExist?.email);
            const refreshToken = await this.TokenService.getRefreshJwtToken(isExist?._id, isExist?.email);
            await this.user.findOneAndUpdate({ email: isExist?.email }, { $set: { refreshToken: refreshToken } });
            const { password: _, ...safeUser } = isExist.toObject();
            return {
                safeUser,
                accessToken,
                refreshToken
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        }
    }
}
exports.AdminAuth = AdminAuth;
