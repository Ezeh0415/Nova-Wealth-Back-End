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
        const session = await mongoose.connection.startSession();

        try {
            return await session.withTransaction(async () => {
                const isExist = await this.user.findOne({ email: userData.email }).session(session);

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
                await newUser.save({ session });

                const token = await this.TokenService.getJwtToken(newUser._id, newUser.email);
                const refreshToken = await this.TokenService.getRefreshJwtToken(newUser._id, newUser.email);

                await this.user.findByIdAndUpdate(
                    newUser._id,
                    { $set: { refreshToken: refreshToken } },
                    { session, new: true }
                );

                const { password: _, ...safeUser } = newUser.toObject();

                return {
                    safeUser,
                    token
                }
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signup transaction failed: ${errorMessage}`);
        } finally {
            await session.endSession();
        }
    }
}