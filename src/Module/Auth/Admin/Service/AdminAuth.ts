import mongoose from "mongoose";
import { AppConfig } from "../../../../config/Config";
import { TokenService } from "../../../../Middleware/jwtConfig/GetJwtToken";
import User, { IUser } from "../../Model/UserSchema";
import bcrypt from 'bcryptJs';

export class AdminAuth {
    private static instance: AdminAuth;
    private user = User
    public config: AppConfig;
    private TokenService: TokenService;
    private readonly SALT_ROUNDS = 10

    private constructor() {
        this.config = AppConfig.getInstance();
        this.TokenService = TokenService.getInstance();
    }

    public static getInstance(): AdminAuth {
        if (!AdminAuth.instance) {
            AdminAuth.instance = new AdminAuth();
        }

        return AdminAuth.instance
    }

    public async adminSignup(userData: Partial<IUser>) {

        try {

            const isExist = await this.user.findOne({ email: userData.email });

            if (isExist) {
                throw new Error("credentials Already in use");
            }

            const hashedPassword = await bcrypt.hash(userData.password as string, this.SALT_ROUNDS)

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

            await this.user.findByIdAndUpdate(
                newUser._id,
                { $set: { refreshToken: refreshToken } },
                { new: true }
            );

            const { password: _, ...safeUser } = newUser.toObject();

            return {
                safeUser,
                token
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        }
    }

    public async adminLogin(userData: Partial<IUser>) {

        try {

            const isExist = await this.user.findOne({ email: userData.email as string });

            if (!isExist) {
                throw new Error("invalid user cridentials");
            }

            const isPasswordCorrect = await bcrypt.compare(userData.password as string, isExist.password);

            if (!isPasswordCorrect) {
                throw new Error("password dosen`t match");
            }

            const accessToken = await this.TokenService.getJwtToken(isExist?._id, isExist?.email);
            const refreshToken = await this.TokenService.getRefreshJwtToken(isExist?._id, isExist?.email);

            await this.user.findOneAndUpdate(
                { email: isExist?.email },
                { $set: { refreshToken: refreshToken } }
            );

            const { password: _, ...safeUser } = isExist.toObject();

            return {
                safeUser,
                accessToken
            }


        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        }
    }
}