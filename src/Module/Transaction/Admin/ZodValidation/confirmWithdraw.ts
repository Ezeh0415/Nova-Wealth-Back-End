import z from "zod";

export const confirmWithdraw = z.object({
    userId: z.string(),
    transactionId: z.string(),
});