import z from "zod";

export const profileUpdate = z.object({
    userId: z.string().optional(),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Email not valid"),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    bitcoin: z.string()
        .optional()
        .or(z.literal('')),  // Allow empty string

    usdt: z.string()
        .optional()
        .or(z.literal('')),  // Allow empty string

    ethereum: z.string()
        .optional()
        .or(z.literal('')),  // Allow empty string

    tron: z.string()
        .optional()
        .or(z.literal('')),  // Allow empty string
});