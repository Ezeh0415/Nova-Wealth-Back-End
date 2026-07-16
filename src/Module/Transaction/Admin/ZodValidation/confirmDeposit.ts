import z from "zod";

export const confirmDeposit = z.object({
    userId: z.string(),
    transactionId: z.string(),
});