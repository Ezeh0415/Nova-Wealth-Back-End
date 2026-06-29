import { z } from "zod";

export const SignUp = z.object({
    fullName: z.string().min(2, "Full Name Must Be At Least 2 Characters").max(50),
    userName: z.string().min(2, "UserName Must Be At Least 2 Characters "). max(50),
    email: z.string().toLowerCase(),
    password: z.string()
        .min(6, "Password must be at least 6 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"), 
        referral: z.string().optional()
})