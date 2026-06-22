import User, { IUser } from "../../Model/UserSchema";
import bcrypt from 'bcryptJs';

export class Authentication {
    private static instance: Authentication;
    private user = User;
    private readonly SALT_ROUNDS = 10;

    public constructor() { };

    public static getInstance(): Authentication {
        if (!Authentication.instance) {
            Authentication.instance = new Authentication();
        }
        return Authentication.instance;
    }

    public async SignUp(userData: Partial<IUser>) {
        const session = await this.user.startSession();

        try {
            return await session.withTransaction(async () => {
                const existingUser = await this.user.findOne({
                    $or: [
                        { email: userData.email },
                        { userName: userData.userName },
                    ]
                }).session(session);

                if (existingUser) {
                    throw new Error("credentials Already in use");
                }

                // hash password 
                const hashedPassword = await bcrypt.hash(userData.password as string, this.SALT_ROUNDS);

                const NewUser = new this.user({
                    fullName: userData.fullName,
                    userName: userData.userName,
                    email: userData.email,
                    password: hashedPassword,
                    ipAddress: userData.ipAddress,
                    userAgent: userData.userAgent,
                });

                await NewUser.save({ session });

                const referralCode = userData.referralCode;
                let referrerUser = null;
                let referralRecord = null;

                if (referralCode && referralCode.trim()) {
                    referrerUser = await this.user.findOne({
                        referralCode: referralCode.trim(),
                    }).session(session);
                }




            });
        } catch (error) {
            throw error;
        } finally {
            await session.endSession();
        }
    }
}