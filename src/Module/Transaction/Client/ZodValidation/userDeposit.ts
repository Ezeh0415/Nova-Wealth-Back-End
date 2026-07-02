import z from "zod";

export const userDeposit = z.object({
    amount: z.number(),
    paymentType: z.string()
})