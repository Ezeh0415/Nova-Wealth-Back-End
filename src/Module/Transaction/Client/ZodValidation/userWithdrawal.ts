import z from "zod";

export const userWithdrawal = z.object({
    amount: z.number(),
    paymentType: z.string(),
    walletAddress: z.string(),
});