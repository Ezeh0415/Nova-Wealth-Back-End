import z from "zod";

export const resetPassword = z.object({
    token: z.string(),
    password: z.string()
        .min(6, "Password must be at least 6 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
})